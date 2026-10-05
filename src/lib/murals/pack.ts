import AsyncStorage from "@react-native-async-storage/async-storage";
import { CryptoDigestAlgorithm, digest } from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import { create } from "zustand";

/**
 * ── Mural pack (mobile) ────────────────────────────────────────────────────
 *
 * Native twin of wadzzoAR `src/lib/murals/pack.ts` (2026-10-05 round):
 *
 *  - starts by itself when the app opens, on any network, not cancellable,
 *    never blocks anything except Murals capture;
 *  - downloads 1 MB byte ranges and APPENDS them to `<pack>.part`, so after
 *    the app is closed or killed it resumes from the file's current size;
 *  - verifies SHA-256 (expo-crypto) against the manifest before it counts as
 *    ready, and again whenever the Murals camera opens;
 *  - the verified file is what fast-tflite loads (`packModelPath()`).
 *
 * Source of truth: `murals/models/manifest.json` on S3 (the `mobile` entry).
 */

const MANIFEST_URL = "https://wadzzo.s3.amazonaws.com/murals/models/manifest.json";
const CHUNK = 1024 * 1024;
const READY_KEY = "wadzzo.muralPack.ready";
const RETRY_S = 8;

type PackFile = { url: string; bytes: number; sha256: string };
type Manifest = { name: string; version: number; mobile: PackFile };

export type PackStatus = "idle" | "checking" | "downloading" | "verifying" | "ready" | "error";
export type PackErrorCode = "offline" | "network" | "storage" | "damaged";

export type PackState = {
  status: PackStatus;
  version: number | null;
  totalBytes: number;
  receivedBytes: number;
  speed: number;
  error: { code: PackErrorCode; message: string } | null;
  retryIn: number | null;
  justFinished: number;
};

export const useMuralPack = create<PackState>()(() => ({
  status: "idle",
  version: null,
  totalBytes: 0,
  receivedBytes: 0,
  speed: 0,
  error: null,
  retryIn: null,
  justFinished: 0,
}));

const set = (p: Partial<PackState>) => useMuralPack.setState(p);

export const packProgress = (s: Pick<PackState, "receivedBytes" | "totalBytes">) => (s.totalBytes ? Math.min(1, s.receivedBytes / s.totalBytes) : 0);

const dir = () => new Directory(Paths.document, "models");
const finalFile = (version: number) => new File(dir(), `mural-pack-v${version}.tflite`);
const partFile = (version: number) => new File(dir(), `mural-pack-v${version}.tflite.part`);

/** file:// URI fast-tflite loads, once the pack is ready. */
export function packModelPath(): string | null {
  const v = useMuralPack.getState().version;
  if (v == null) return null;
  const f = finalFile(v);
  return f.exists ? f.uri : null;
}

type Flag = { version: number; sha256: string };
const readFlag = async (): Promise<Flag | null> => {
  try {
    const raw = await AsyncStorage.getItem(READY_KEY);
    return raw ? (JSON.parse(raw) as Flag) : null;
  } catch {
    return null;
  }
};
const writeFlag = (f: Flag | null) => (f ? AsyncStorage.setItem(READY_KEY, JSON.stringify(f)) : AsyncStorage.removeItem(READY_KEY)).catch(() => undefined);

async function sha256Of(file: File) {
  const bytes = await file.bytes();
  const d = await digest(CryptoDigestAlgorithm.SHA256, bytes);
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** One byte range via XHR, so progress events arrive while it downloads. */
function fetchRange(url: string, from: number, to: number, onBytes: (n: number) => void): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";
    xhr.setRequestHeader("Range", `bytes=${from}-${to}`);
    xhr.timeout = 60_000;
    xhr.onprogress = (e) => onBytes(e.loaded);
    xhr.onload = () => {
      if (xhr.status !== 206 && xhr.status !== 200) return reject(new Error(`HTTP ${xhr.status}`));
      let buf = new Uint8Array(xhr.response as ArrayBuffer);
      if (xhr.status === 200) buf = buf.slice(from, to + 1);
      if (buf.byteLength !== to - from + 1) return reject(new Error("short read"));
      resolve(buf);
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.ontimeout = () => reject(new Error("timeout"));
    xhr.send();
  });
}

let running: Promise<void> | null = null;
let retryTimer: ReturnType<typeof setInterval> | null = null;
let manifestCache: Manifest | null = null;

function scheduleRetry() {
  if (retryTimer) clearInterval(retryTimer);
  let left = RETRY_S;
  set({ retryIn: left });
  retryTimer = setInterval(() => {
    left -= 1;
    if (left > 0) return set({ retryIn: left });
    if (retryTimer) clearInterval(retryTimer);
    retryTimer = null;
    set({ retryIn: null });
    void startMuralPack();
  }, 1000);
}

function fail(code: PackErrorCode, message: string, retry = true) {
  set({ status: "error", error: { code, message }, speed: 0 });
  if (retry) scheduleRetry();
}

async function run() {
  set({ status: "checking", error: null, retryIn: null });

  let manifest: Manifest;
  try {
    const res = await fetch(MANIFEST_URL, { headers: { "Cache-Control": "no-cache" } });
    if (!res.ok) throw new Error(`manifest ${res.status}`);
    manifest = (await res.json()) as Manifest;
    manifestCache = manifest;
  } catch {
    // Offline but installed → still ready.
    const flag = await readFlag();
    if (flag && finalFile(flag.version).exists) {
      set({ status: "ready", version: flag.version, totalBytes: finalFile(flag.version).size, receivedBytes: finalFile(flag.version).size });
      return;
    }
    fail("offline", "You're offline — the download continues when you're back online.");
    return;
  }
  const file = manifest.mobile;
  set({ version: manifest.version, totalBytes: file.bytes });

  const flag = await readFlag();
  const done = finalFile(manifest.version);
  if (flag?.sha256 === file.sha256 && done.exists && done.size === file.bytes) {
    set({ status: "ready", receivedBytes: file.bytes, speed: 0 });
    return;
  }

  try {
    if (!dir().exists) dir().create({ intermediates: true });
  } catch {
    fail("storage", "Couldn't create space for the mural pack on this phone.", false);
    return;
  }
  const part = partFile(manifest.version);
  if (!part.exists) part.create();
  // Resume from whole chunks only (a half-written chunk is dropped).
  let have = Math.floor(part.size / CHUNK) * CHUNK;
  if (have !== part.size) {
    const keep = have ? (await part.bytes()).slice(0, have) : new Uint8Array();
    part.write(keep);
  }
  set({ status: "downloading", receivedBytes: have });

  let speed = 0;
  while (have < file.bytes) {
    const to = Math.min(file.bytes, have + CHUNK) - 1;
    let lastT = Date.now();
    let lastN = 0;
    let chunk: Uint8Array;
    try {
      chunk = await fetchRange(file.url, have, to, (n) => {
        const now = Date.now();
        if (now - lastT < 200) return;
        const inst = ((n - lastN) * 1000) / (now - lastT);
        speed = speed ? speed * 0.8 + inst * 0.2 : inst;
        lastT = now;
        lastN = n;
        set({ receivedBytes: have + n, speed });
      });
    } catch {
      fail("network", "The connection dropped. Retrying…");
      return;
    }
    try {
      part.write(chunk, { append: true });
    } catch {
      fail("storage", "Not enough storage space for the mural pack (≈23 MB).", false);
      return;
    }
    have += chunk.byteLength;
    set({ receivedBytes: have });
  }

  set({ status: "verifying", speed: 0 });
  const hash = await sha256Of(part);
  if (hash !== file.sha256) {
    part.delete();
    set({ receivedBytes: 0 });
    fail("damaged", "The download was damaged. Starting it again…");
    return;
  }
  if (done.exists) done.delete();
  await part.move(done);
  await writeFlag({ version: manifest.version, sha256: file.sha256 });
  set({ status: "ready", receivedBytes: file.bytes, speed: 0, justFinished: Date.now() });
}

/** Start (or join) the background install. Safe to call any number of times. */
export function startMuralPack(): Promise<void> {
  if (running) return running;
  running = run()
    .catch(() => fail("network", "Something went wrong with the mural pack. Retrying…"))
    .finally(() => {
      running = null;
    });
  return running;
}

/** Re-hash the installed file; a mismatch deletes it and re-downloads. */
export async function verifyMuralPack(): Promise<"ok" | "missing" | "damaged"> {
  const flag = await readFlag();
  const version = useMuralPack.getState().version ?? flag?.version;
  if (version == null || !finalFile(version).exists) {
    await writeFlag(null);
    void startMuralPack();
    return "missing";
  }
  set({ status: "verifying" });
  const expected = manifestCache?.mobile.sha256 ?? flag?.sha256;
  const hash = await sha256Of(finalFile(version));
  if (expected && hash !== expected) {
    finalFile(version).delete();
    await writeFlag(null);
    set({ receivedBytes: 0 });
    fail("damaged", "The mural pack was damaged. Downloading a fresh copy…");
    return "damaged";
  }
  set({ status: "ready", error: null });
  return "ok";
}

/** Settings › Delete pack. It comes back on the next app open. */
export async function deleteMuralPack() {
  const v = useMuralPack.getState().version;
  if (v != null) {
    if (finalFile(v).exists) finalFile(v).delete();
    if (partFile(v).exists) partFile(v).delete();
  }
  await writeFlag(null);
  set({ status: "idle", receivedBytes: 0, speed: 0, error: null });
}

export function formatBytes(n: number) {
  return n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(0, Math.round(n / 1e3))} KB`;
}

/** Whether the game-style pack panel is open (opened from the AR-button ring). */
export const usePackSheet = create<{ open: boolean; setOpen: (open: boolean) => void }>()((setState) => ({
  open: false,
  setOpen: (open) => setState({ open }),
}));

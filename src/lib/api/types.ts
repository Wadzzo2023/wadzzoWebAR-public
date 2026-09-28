import type { ArBrand, ArPin, Rarity } from "~/lib/ar/types";

/**
 * Response shapes of /api/mobile/v1 — the JSON form of the tRPC procedures
 * they wrap (dates arrive as ISO strings). Keep in step with docs/02-api.md.
 */
export type { ArBrand, ArPin };

export type WalletType = "emailPass" | "google" | "apple" | "albedo" | string;

export interface SessionUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  walletType: WalletType;
  emailVerified: boolean;
}

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  image: string | null;
  coverImage: string | null;
  joinedAt: string | null;
  signUpMethod: string | null;
  walletType: WalletType;
  followingCount: number;
  collectedCount: number;
}

export interface Balance {
  assetCode: string;
  balance: number;
  hasTrustline: boolean;
}

export interface PinPage {
  pins: ArPin[];
  total: number;
  nextCursor: number | null;
}

export interface CollectionPage extends PinPage {
  facets: {
    total: number;
    brands: number;
    best: Rarity;
    counts: Record<Rarity, number>;
  };
}

export type FollowResult =
  | { followed: boolean }
  | { needsSignature: true; xdr: string };

// ── Bounty ────────────────────────────────────────────────────────────────

export type EntryStatus = "UNCHECKED" | "CHECKED" | "ONREVIEW" | "APPROVED" | "REJECTED";

export interface BountyCard {
  id: number;
  title: string;
  imageUrl: string | null;
  brand: { id: string; name: string; avatarUrl: string | null };
  rewardUsd: number;
  rewardAsset: number;
  assetCode: string;
  totalWinners: number;
  spotsLeft: number;
  participants: number;
  requiredBalance: number;
  endDate: string | null;
  createdAt: string;
  open: boolean;
  viewer: {
    joined: boolean;
    won: boolean;
    entryCount: number;
    latestEntryStatus: EntryStatus | null;
  };
}

export interface BountyDetail extends BountyCard {
  description: string;
  imageUrls: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  totalEntries: number;
  commentCount: number;
  isOwner: boolean;
}

export interface BountyPage {
  items: BountyCard[];
  nextCursor: number | null;
}

export interface EntryMedia {
  id?: number;
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface Entry {
  id: number;
  content: string;
  status: EntryStatus;
  createdAt: string;
  medias: EntryMedia[];
}

export interface CommentAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

export interface Reply {
  id: number;
  content: string;
  createdAt: string;
  author: CommentAuthor;
  mine: boolean;
}

export interface Comment extends Reply {
  replies: Reply[];
}

export interface ThreadMessage {
  id: number;
  content: string;
  fromBrand: boolean;
  createdAt: string;
}

export interface AttentionItem {
  kind: "won" | "reply";
  bountyId: number;
  title: string;
  at: string;
}

export interface SignedUpload {
  uploadUrl: string;
  fileUrl: string;
  fileName: string;
}

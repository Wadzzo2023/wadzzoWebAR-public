export function addrShort(addr: string, size?: number) {
    if (!addr) return "No address";
    const cropSize = size ?? 3;
    return `${addr.substring(0, cropSize)}...${addr.substring(addr.length - cropSize, addr.length)}`;
}

export function checkPubkey(pubkey: string): boolean {
    return !pubkey || pubkey.trim() === "" || !(pubkey.length === 56);
}

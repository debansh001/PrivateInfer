export function coinPublicKeyToBytes(pk: string | Uint8Array | null | undefined): Uint8Array {
  if (!pk) return new Uint8Array(32);
  
  if (pk instanceof Uint8Array) {
    if (pk.length === 32) return pk;
    const bytes = new Uint8Array(32);
    bytes.set(pk.slice(0, 32));
    return bytes;
  }
  
  const hex = typeof pk === 'string' ? pk : Array.from(pk as unknown as number[]).map((b) => b.toString(16).padStart(2, '0')).join('');
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    const val = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    bytes[i] = isNaN(val) ? 0 : val;
  }
  return bytes;
}

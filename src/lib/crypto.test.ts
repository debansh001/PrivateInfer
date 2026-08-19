import { coinPublicKeyToBytes } from './crypto';

describe('crypto utils', () => {
  test('coinPublicKeyToBytes handles null/undefined correctly', () => {
    const result = coinPublicKeyToBytes(null);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
    expect(result.every(b => b === 0)).toBe(true);
  });

  test('coinPublicKeyToBytes handles 64-char hex string correctly', () => {
    const hex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const result = coinPublicKeyToBytes(hex);
    expect(result.length).toBe(32);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(35); // 0x23
    expect(result[31]).toBe(239); // 0xef
  });

  test('coinPublicKeyToBytes handles Uint8Array correctly', () => {
    const arr = new Uint8Array(32);
    arr[0] = 42;
    arr[31] = 99;
    const result = coinPublicKeyToBytes(arr);
    expect(result.length).toBe(32);
    expect(result[0]).toBe(42);
    expect(result[31]).toBe(99);
  });
});

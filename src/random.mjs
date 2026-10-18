// Deterministic helpers: the same seed always builds the same case.
export const hash = text => {
  let n = 2166136261;
  for (const c of text) {
    n ^= c.charCodeAt(0);
    n = Math.imul(n, 16777619);
  }
  return (n >>> 0).toString(16).padStart(8, '0');
};
export const rng = seed => {
  let a = parseInt(hash(seed), 16);
  return () => {
    a += 0x6d2b79f5;
    let n = a;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
};
export const pick = (items, random) => items[Math.floor(random() * items.length)];
export function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export const clock = n =>
  Math.floor(n / 60)
    .toString()
    .padStart(2, '0') +
  ':' +
  (n % 60).toString().padStart(2, '0');

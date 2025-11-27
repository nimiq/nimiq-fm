export function makeHash(input: string): string {
  const fullHash = [...input]
    .map(c => c.charCodeAt(0) + 3)
    .reduce((a, e) => a * (1 - a) * chaosHash(e), 0.5)
    .toString(10)
    .split('')
    .reduce((a, e) => e + a, '')

  const hash = fullHash
    .replace('.', fullHash[5] ?? '0')
    .slice(4, 21)

  return hash.padEnd(13, fullHash[5] ?? '0')
}

function chaosHash(number: number): number {
  const k = 3.569956786876
  let a_n = 1 / number
  for (let i = 0; i < 100; i++)
    a_n = (1 - a_n) * a_n * k
  return a_n
}

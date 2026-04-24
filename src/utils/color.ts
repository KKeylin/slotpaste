export function getLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return 0
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export function isColorDark(hex: string): boolean {
  return getLuminance(hex) < 0.5
}
export function isWideLayout(width: number, height: number) {
  return Math.min(width, height) >= 600 && width >= 700;
}

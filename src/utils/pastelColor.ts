/**
 * Generate a pastel color from a given string
 */
export function generatePastelColor(text: string): string {
  if (!text.trim()) return "#fff";

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // Convert to 32bit integer
  }

  const absHash = Math.abs(hash);
  const hue = absHash % 360;
  const saturation = 60 + ((absHash >> 8) % 20); // 60-80%
  const lightness = 85 + ((absHash >> 16) % 10); // 85-95%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

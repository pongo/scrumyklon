/**
 * Generate a pastel color from a given string
 */
export function generatePastelColor(text: string): string {
  if (!text.trim()) return "#f0f0f0";

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
    // hash &= hash; // Convert to 32bit integer
  }

  // Hue: full spectrum 0-360
  // Saturation: 25-45% (soft pastel, not too vivid)
  // Lightness: 85-95% (very light, almost white)
  const hue = Math.abs(hash) % 360;
  const saturation = 55 + (Math.abs(hash >> 8) % 21);
  const lightness = 90 + (Math.abs(hash >> 16) % 11);

  // return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  return `hsl(${hue}, 70%, 90%)`;
}

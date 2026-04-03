/**
 * Generate a pastel color from a given string (e.g. assignee name).
 * Uses a simple hash function to produce consistent HSL colors with
 * low saturation and high lightness for a pastel look.
 */
export function generatePastelColor(text: string): string {
  if (!text.trim()) return "#f0f0f0";

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Hue: 0-360, Saturation: 40-60%, Lightness: 75-85%
  const hue = Math.abs(hash) % 360;
  const saturation = 40 + (Math.abs(hash >> 8) % 21);
  const lightness = 75 + (Math.abs(hash >> 16) % 11);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

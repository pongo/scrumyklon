import slugify from "slugify";

export const RESERVED_SLUGS = ["new"];

/**
 * Generates a unique slug from a title.
 * If slug exists OR is "new", it appends "-2" (or increments the existing number suffix).
 *
 * Examples:
 * "Hello" (exists) -> "hello-2"
 * "Hello 2" (exists) -> "hello-3"
 * "new" -> "new-2"
 */
export function generateUniqueSlug(title: string, existingSlugs: string[]): string {
  const baseSlug = slugify(title, { lower: true, strict: true }) || "board";

  if (!existingSlugs.includes(baseSlug) && !RESERVED_SLUGS.includes(baseSlug)) {
    return baseSlug;
  }

  let slug = baseSlug;
  let counter = 2;

  const match = slug.match(/-(\d+)$/);
  if (match && match[1]) {
    slug = slug.substring(0, slug.lastIndexOf("-"));
    counter = parseInt(match[1], 10) + 1;
  }

  let finalSlug = `${slug}-${counter}`;
  while (existingSlugs.includes(finalSlug) || RESERVED_SLUGS.includes(finalSlug)) {
    counter++;
    finalSlug = `${slug}-${counter}`;
  }

  return finalSlug;
}

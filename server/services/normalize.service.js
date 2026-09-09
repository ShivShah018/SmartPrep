/**
 * Normalize/clean extracted paper text before analysis.
 * - Collapses excessive whitespace and blank lines
 * - Trims each line
 * - Normalizes unicode quotes/dashes to ASCII
 * - Removes common page header/footer noise like "Page 1 of 3"
 */
export function normalizeText(text) {
  if (!text) return '';

  return text
    .replace(/\r\n/g, '\n')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^(page\s*\d+\s*(of\s*\d+)?|p\.?\s*\d+|--\d+--)$/i.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}
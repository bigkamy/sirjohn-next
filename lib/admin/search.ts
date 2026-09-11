/**
 * Cleans a search box value for PostgREST filters built with `ilike` below. The value is
 * wrapped in double quotes there, which makes dots, commas and parentheses literal (emails and
 * SKUs contain dots); this strips what could still break out of the quotes or act as a LIKE
 * wildcard. A leading "#" is dropped so "#GOLF1001" finds order GOLF1001.
 */
export function searchTerm(value: string) {
  return value
    .trim()
    .replace(/^#/, "")
    .replace(/["\\%_*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/** One case-insensitive "contains" condition for `.or(...)`, e.g. ilike("email", term). */
export function ilike(column: string, term: string) {
  return `${column}.ilike."%${term}%"`;
}

export function rangeFor(page: number, pageSize: number) {
  const from = (Math.max(1, page) - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

/** PostgREST's answer for a page past the end of the results. */
export const RANGE_NOT_SATISFIABLE = "PGRST103";

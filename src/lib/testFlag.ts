// Seed/test fixtures (e.g. "Test Fight Night", "Debug Test Club") have no
// dedicated schema flag to filter on, and hiding them would require a backend
// query change that also affects the web app. This is a narrow, additive,
// mobile-only heuristic to visibly badge anything that looks like test data
// rather than let it pass as a real listing.
export function looksLikeTest(...values: Array<string | undefined | null>): boolean {
  return values.some(v => Boolean(v) && /\btest\b|\bdebug\b/i.test(v as string))
}

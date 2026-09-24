/**
 * Czech typography: a one-letter word (v, s, k, z, o, u, a, i) must not end a line,
 * so the space after it becomes a non-breaking one. Applied to every text in the config.
 */
export function keepShortWordsAttached<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/(?<=^|[\s(„])([aikosuvzAIKOSUVZ]) /g, '$1\u00A0') as T;
  }
  if (Array.isArray(value)) return value.map(keepShortWordsAttached) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, keepShortWordsAttached(v)])) as T;
  }
  return value;
}

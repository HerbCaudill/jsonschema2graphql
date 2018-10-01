import R from 'ramda'

/** Turns an enum key from JSON schema into one that is safe for GraphQL. */
export function graphqlSafeEnumKey(value: string): string {
  const trim = (s: string) => s.trim()
  const isNum = (s: string): boolean => /^[0-9]/.test(s)
  const safeNum = (s: string): string => (isNum(s) ? `VALUE_${s}` : s)
  const convertComparators = (s: string): string =>
    ({
      '<': 'LT',
      '<=': 'LTE',
      '>=': 'GTE',
      '>': 'GT',
    }[s] || s)
  const sanitize = (s: string) => s.replace(/[^_a-zA-Z0-9]/g, '_')
  return R.compose(
    sanitize,
    convertComparators,
    safeNum,
    trim
  )(value)
}

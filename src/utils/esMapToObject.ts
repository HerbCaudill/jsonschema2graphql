export const esMapToObject = (m: Map<any, any>): any =>
  [...m.entries()].reduce((o, [k, v]) => ((o[k] = v), o), {})

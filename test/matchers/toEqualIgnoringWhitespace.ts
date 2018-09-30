import { matcherHint, printReceived, printExpected } from 'jest-matcher-utils'
import diff from 'jest-diff'

const compressWhitespace = (a: string[]) =>
  a.map(s =>
    s
      .replace(/^\s*$(?:\r\n?|\n)/gm, ``) // remove empty lines
      .replace(/[ \t]+/g, ` `) // collapse double spaces
      .replace(/(\s*(?:\r\n?|\n)\s*)+/g, `\r\n`) // remove space before/after linefeeds
      .trim()
  )

const name = `toEqualIgnoringWhitespace`

const toEqualIgnoringWhitespace = (actual: string, expected: string) => {
  const [actualComp, expectedComp] = compressWhitespace([actual, expected])
  const pass = actualComp === expectedComp
  const message = pass
    ? () => `${matcherHint(`.not.${name}`)}\n\n`
    : () => {
        const diffString = diff(expectedComp, actualComp)
        return (
          `${matcherHint(`.${name}`)}\n\n` +
          `${diffString ? `\n\nDifference:\n\n${diffString}` : ``}`
        )
      }
  return { actual, expected, message, name, pass }
}

expect.extend({ toEqualIgnoringWhitespace })

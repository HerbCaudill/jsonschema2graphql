import {
  matcherHint,
  printReceived,
  printExpected,
} from 'jest-matcher-utils'
import diff from 'jest-diff'

const compressWhitespace = (a: string[]) =>
  a.map(s => s.replace(/\s+/g, ` `).trim())

const name = `toEqualIgnoringWhitespace`

const toEqualIgnoringWhitespace = (actual: string, expected: string) => {
  const [actualComp, expectedComp] = compressWhitespace([actual, expected])
  const pass = actualComp === expectedComp
  const actualVsReceivedMsg =
    `Expected value (compressed whitespace) to equal:\n` +
    `  ${printExpected(expectedComp)}\n` +
    `Received value (compressed whitespace):\n` +
    `  ${printReceived(actualComp)}`
  const message = pass
    ? () => `${matcherHint(`.not.${name}`)}\n\n${actualVsReceivedMsg}\n\n`
    : () => {
        const diffString = diff(expectedComp, actualComp)
        return (
          `${matcherHint(`.${name}`)}\n\n${actualVsReceivedMsg}\n\n` +
          `${diffString ? `\n\nDifference:\n\n${diffString}` : ``}`
        )
      }
  return { actual, expected, message, name, pass }
}

expect.extend({ toEqualIgnoringWhitespace })

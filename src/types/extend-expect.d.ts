declare namespace jest {
  interface Matchers<R> {
    toEqualIgnoringWhitespace: (s: string) => void
  }

  interface Expect {
    toEqualIgnoringWhitespace: (s: string) => void
  }
}

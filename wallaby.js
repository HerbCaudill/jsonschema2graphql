module.exports = function(wallaby) {
  return {
    files: ['src/**/*.ts', 'test/**/*.*', '!test/**/*.test.ts', 'tsconfig.json'],
    tests: ['test/**/*.test.ts'],
    env: {
      type: 'node',
    },
    testFramework: 'jest',
  }
}

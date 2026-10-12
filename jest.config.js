module.exports = {
  preset: 'react-native',
  /**
   * `.kilo/` holds git worktrees — full copies of this repo, ~143MB, each with
   * its own package.json. Jest's haste map crawls them on every run, which
   * produced "Haste module naming collision" warnings for `functions` and
   * `CleanersChoice` (two package.json files claiming the same module name) and
   * added seconds of startup to every invocation.
   *
   * That cost is why `workSessionRecordScreens` intermittently blew the default
   * 5s timeout in a full run while passing on its own: the test itself is fine,
   * the runner was just starting slowly and the first test in the file paid for
   * it. Ignoring the worktrees here rather than as a flag on one npm script
   * means `npm test`, a watch run and an IDE runner all get the same fix.
   */
  modulePathIgnorePatterns: ['<rootDir>/.kilo/'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/.kilo/',
    // Shared fixtures, not suites - jest reported them as "must contain at
    // least one test".
    '<rootDir>/__tests__/helpers/',
  ],
  /**
   * The first test in each screen file pays the cost of compiling that
   * screen's whole module graph - measured at 1.2-4.7s depending on the
   * screen, against a 5s default. The tests themselves run in tens of
   * milliseconds once the graph is warm, so under parallel load the first one
   * in a file would intermittently time out while passing in isolation. This
   * budgets for the module load rather than the assertions.
   */
  testTimeout: 15000,
  // See __mocks__/vectorIcons.js for why these are stubbed rather than
  // transformed.
  moduleNameMapper: {
    '^react-native-vector-icons/(.*)$': '<rootDir>/__mocks__/vectorIcons.js',
    '^react-native-linear-gradient$': '<rootDir>/__mocks__/linearGradient.js',
  },
};

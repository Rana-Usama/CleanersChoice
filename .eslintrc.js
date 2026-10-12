module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['scripts/test-work-sessions-emulator.cjs'],
      env: {node: true, es2022: true},
      parserOptions: {ecmaVersion: 2022},
    },
  ],
};

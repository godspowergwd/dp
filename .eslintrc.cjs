module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['node_modules', 'dist', 'build', '.next', 'out', 'generated'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
  overrides: [
    {
      files: ['apps/web/**/*.{ts,tsx}'],
      settings: { react: { version: 'detect' } },
      extends: ['plugin:react/recommended', 'plugin:@next/next/recommended'],
      rules: {
        'react/react-in-jsx-scope': 'off',
      },
    },
  ],
};

/**
 * Guard rail fallback for unsupported environments.
 *
 * This file is only reached if the consumer's bundler does not support
 * the 'exports' field in package.json and falls back to the 'main' entry point.
 */

throw new Error(
  `[expo-passkey] Loaded in an unsupported environment.

This library requires a bundler that supports the "exports" field in package.json.

✅ To fix:
- For React Native (Metro): This should work automatically with Expo SDK 50+.
- For Web (Webpack 5+, Vite 3+, etc.): Ensure your bundler respects conditional exports and targets "browser".
- For Node.js (server): Import from 'expo-passkey/server'.
- For older bundlers: Upgrade your bundler or build tools.

📘 More info: https://nodejs.org/api/packages.html#conditional-exports
`,
);

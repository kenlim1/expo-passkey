/**
 * Guard rail fallback - use platform-specific imports instead.
 *
 * 📱 React Native/Expo: import from "expo-passkey/native"
 * 🌐 Web/Browser: import from "expo-passkey/web"
 * 🖥️ Node.js Server: import from "expo-passkey/server"
 */

// Never type prevents usage
declare const _guard: never;
export const expoPasskeyClient = _guard;

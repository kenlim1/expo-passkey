# Expo Passkey

<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue" alt="Platform iOS | Android | Web" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue" alt="TypeScript Ready" />
  <img src="https://img.shields.io/badge/Status-BETA-orange" alt="Beta Status" />
</p>

This is a cross-platform Expo module and Better Auth plugin that brings passkey authentication to your Expo apps on **web, iOS, and Android**. Features a unified passkey table structure that works seamlessly across all platforms, making it perfect for both universal apps using react-native-web and projects with separate mobile and web frontends.

> **🚀 v0.2.0-beta**: Now includes web support and unified table structure for seamless cross-platform authentication!

## 📱 Example Project

Check out our comprehensive example implementation at [neb-starter](https://github.com/iosazee/neb-starter), which demonstrates how to use Expo Passkey across a full-stack application:

- **Backend**: Built with Next.js, showcasing server-side implementation
- **Mobile App**: Complete Expo mobile client with passkey authentication
- **Web App**: Full web implementation using the same codebase
- **Working Demo**: See passkey registration and authentication in action across platforms
- **Best Practices**: Demonstrates recommended implementation patterns

This starter kit provides a working reference that you can use as a foundation for your own projects or to understand how all the pieces fit together.

## 🎬 Video Demos

See Expo Passkey in action on different platforms:

### iOS Demo
[![Watch the iOS Demo](https://img.shields.io/badge/Watch-iOS%20Demo%20with%20Face%20ID-blue?style=for-the-badge&logo=apple)](https://server.nubialand.com/uploads/Expo-Passkey-Demo.mp4)

### Android Demo
[![Watch the Android Demo](https://img.shields.io/badge/Watch-Android%20Demo%20with%20Fingerprint-green?style=for-the-badge&logo=android)](https://server.nubialand.com/uploads/epk-demo.mp4)

*These demos show the complete passkey experience from registration to authentication using biometric verification.*

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Platform Requirements](#platform-requirements)
- [Installation](#installation)
- [Platform Setup](#platform-setup)
  - [iOS Setup](#ios-setup)
  - [Android Setup](#android-setup)
  - [Web Setup](#web-setup)
- [Quick Start](#quick-start)
- [Complete API Reference](#complete-api-reference)
- [Database Schema](#database-schema)
- [Cross-Platform Usage](#cross-platform-usage)
- [Database Optimizations](#database-optimizations)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [Error Handling](#error-handling)
- [Migration from v0.1.x](#migration-from-v01x)
- [License](#license)

## Overview

Expo Passkey bridges the gap between Better Auth's backend capabilities and cross-platform authentication on web, mobile, and native platforms. It allows your users to authenticate securely using Face ID, Touch ID, fingerprint recognition, or platform authenticators in web browsers, providing a modern, frictionless authentication experience.

This plugin implements a comprehensive FIDO2/WebAuthn passkey solution that connects Better Auth's backend infrastructure with platform-specific authentication capabilities, offering a complete end-to-end solution that works seamlessly across web, iOS, and Android.

## Key Features

- ✅ **Cross-Platform Support**: Works on web browsers, iOS (16+), and Android (10+)
- ✅ **Unified Table Structure**: Single table works across web, mobile, and all platforms
- ✅ **Universal App Ready**: Perfect for Expo + react-native-web projects and separate frontend architectures
- ✅ **Platform-Specific Optimization**: Native biometrics on mobile, WebAuthn in browsers
- ✅ **Seamless Integration**: Works directly with Better Auth server and client
- ✅ **Complete Lifecycle Management**: Registration, authentication, and revocation flows
- ✅ **Type-Safe API**: Comprehensive TypeScript definitions and autocomplete
- ✅ **Secure Device Binding**: Ensures keys are bound to specific devices/platforms
- ✅ **Automatic Cleanup**: Optional automatic revocation of unused passkeys
- ✅ **Rich Metadata**: Store and retrieve device-specific context with each passkey
- ✅ **Portable Passkeys**: Supports iCloud Keychain, Google Password Manager, and hardware keys

## Platform Requirements

| Platform | Minimum Version | Authentication Requirements |
|----------|----------------|----------------------------|
| Web      | Modern browsers with WebAuthn | Platform authenticator or security key |
| iOS      | iOS 16+        | Face ID or Touch ID configured |
| Android  | Android 10+ (API level 29+) | Fingerprint or Face Recognition configured |

## Installation

### Client Installation
In your Expo app:
```bash
# Install the package
npm i expo-passkey@beta

# Install peer dependencies (if not already installed)
npx expo install expo-application expo-local-authentication expo-secure-store expo-crypto expo-device

# For web support, also install:
npm install @simplewebauthn/browser
```

### Server Installation
In your auth server:
```bash
# Install the package
npm i expo-passkey@beta

# Install peer dependencies (if not already installed)
npm install better-auth better-fetch @simplewebauthn/server zod
```

## Platform Setup

### iOS Setup

To enable passkeys on iOS, you need to associate your app with a domain:

1. **Host Apple App Site Association File**:
   
   Create an Apple App Site Association file at `https://<your_domain>/.well-known/apple-app-site-association`:

   ```json
   {
     "webcredentials": {
       "apps": ["<teamID>.<bundleID>"]
     }
   }
   ```

   Replace `<teamID>` with your Apple Developer Team ID and `<bundleID>` with your app's bundle identifier.

2. **Configure Your Expo App**:
   
   Add the associated domain to your `app.json`:

   ```json
   {
     "expo": {
       "ios": {
         "associatedDomains": ["webcredentials:your_domain"]
       }
     }
   }
   ```

3. **Configure Server Plugin**:
   
   Add your domain to the `origin` array in the expoPasskey options:

   ```typescript
   expoPasskey({
     rpId: "example.com",
     rpName: "Your App Name",
     origin: ["https://example.com"] // Your associated domain
   })
   ```

### Android Setup

To enable passkeys on Android:

1. **Host Asset Links JSON File**:
   
   Create an asset links file at `https://<your_domain>/.well-known/assetlinks.json`:

   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "<package_name>",
         "sha256_cert_fingerprints": ["<sha256_cert_fingerprint>"]
       }
     }
   ]
   ```

   You can generate this file using the [Digital Asset Links Tool](https://developers.google.com/digital-asset-links/tools/generator).

2. **Get the Android Origin Value**:
   
   For Android, the origin is derived from the SHA-256 hash of the APK signing certificate. Use this Python code to convert your SHA-256 fingerprint:

   ```python
   import binascii
   import base64
   
   fingerprint = '91:F7:CB:F9:D6:81:53:1B:C7:A5:8F:B8:33:CC:A1:4D:AB:ED:E5:09:C5'
   print("android:apk-key-hash:" + base64.urlsafe_b64encode(binascii.a2b_hex(fingerprint.replace(':', ''))).decode('utf8').replace('=', ''))
   ```

   Replace the value of `fingerprint` with your own.

3. **Configure Server Plugin**:
   
   Add the android origin to your expoPasskey options:

   ```typescript
   expoPasskey({
     rpId: "example.com",
     rpName: "Your App Name",
     origin: [
       "https://example.com", // Your website
       "android:apk-key-hash:<your-base64url-encoded-hash>" // Android app signature
     ]
   })
   ```

### Web Setup

Web setup is automatic when using the plugin in a browser environment. Ensure your site is served over HTTPS (required for WebAuthn) and that your server configuration includes your web domain in the `origin` array.

## Quick Start

1. **Add to Server**:
```typescript
import { betterAuth } from "better-auth";
import { expoPasskey } from "expo-passkey/server";

export const auth = betterAuth({
  plugins: [
    expoPasskey({
      rpId: "example.com",
      rpName: "Your App Name",
      origin: [
        "https://example.com",
        "android:apk-key-hash:<your-base64url-encoded-hash>"
      ]
    })
  ]
});
```

2. **Migrate the Database**

Run the migration or generate the schema to add the necessary fields and tables to the database.

<details>
  <summary><strong>🚀 Migrate</strong></summary>

  ```bash
  npx @better-auth/cli migrate
  ```

</details>

<details>
  <summary><strong>⚙️ Generate</strong></summary>

  ```bash
  npx @better-auth/cli generate
  ```

</details>

See the [Schema](#database-schema) to add the models/fields manually.

3. **Add to Client**:

**For Mobile App (React Native/Expo)**:
```typescript
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { expoPasskeyClient } from "expo-passkey";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_AUTH_BASE_URL,
  plugins: [
    expoClient({
      scheme: "your-app",
      storagePrefix: "your_app",
      storage: SecureStore,
    }),
    expoPasskeyClient({
      storagePrefix: "your_app",
    }),
    // ... other plugins
  ],
});

export const { 
  registerPasskey, 
  authenticateWithPasskey,
  isPasskeySupported,
  getBiometricInfo,
  getDeviceInfo
} = authClient;
```

**For Web App (Next.js/React)**:
```typescript
import { createAuthClient } from "better-auth/react";
import { expoPasskeyClient } from "expo-passkey";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    expoPasskeyClient(),
    // ... other plugins
  ],
});

export const { 
  registerPasskey, 
  authenticateWithPasskey,
  isPasskeySupported
} = authClient;
```


## Cross-Platform Usage


**Mobile App Example**:
```typescript
// Mobile app (React Native/Expo)
const { data, error } = await registerPasskey({
  userId: "user123",
  userName: "john@example.com",
  displayName: "John Doe",
  rpId: "example.com",
  rpName: "My App"
});

if (data) {
  console.log("Passkey registered on mobile!");
}
```

**Web App Example**:
```typescript
// Web app (Next.js/React)
const { data, error } = await registerPasskey({
  userId: "user123",
  userName: "john@example.com", 
  displayName: "John Doe",
  rpId: "example.com",
  rpName: "My App"
});

if (data) {
  console.log("Passkey registered on web!");
}
```


### Platform-Specific Features

You can check the current platform and access platform-specific features:

```typescript
import { Platform } from 'react-native';

// Mobile-specific features
if (Platform.OS !== 'web') {
  const biometricInfo = await getBiometricInfo();
  const deviceInfo = await getDeviceInfo();
}

// Web-specific features
if (Platform.OS === 'web') {
  const isAvailable = await isPlatformAuthenticatorAvailable();
}
```

### Unified Passkey Management

With the unified table structure, passkeys work seamlessly across platforms:

- A user can register a passkey on mobile and use it with iCloud Keychain on web
- Security keys work across all platforms  
- The same API manages passkeys regardless of where they were created
- Single database table handles all platform variations

## Complete API Reference

### Client API

#### `registerPasskey(options): Promise<RegisterPasskeyResult>`

Registers a new passkey for a user. Works across all platforms.

```typescript
interface RegisterOptions {
  userId: string;              // Required: User ID to associate with the passkey
  userName: string;            // Required: User name for the passkey
  displayName?: string;        // Optional: Display name (defaults to userName)
  rpId?: string;               // Optional: Relying Party ID (auto-detected on web)
  rpName?: string;             // Optional: Relying Party name
  attestation?: "none" | "indirect" | "direct" | "enterprise";
  authenticatorSelection?: {   // Optional: Authenticator selection criteria
    authenticatorAttachment?: "platform" | "cross-platform";
    residentKey?: "required" | "preferred" | "discouraged";
    requireResidentKey?: boolean;
    userVerification?: "required" | "preferred" | "discouraged";
  };
  timeout?: number;            // Optional: Timeout in milliseconds
  metadata?: {                 // Optional: Additional metadata to store
    deviceName?: string;       // Device name (e.g. "John's iPhone")
    deviceModel?: string;      // Device model (e.g. "iPhone 14 Pro")
    appVersion?: string;       // App version
    lastLocation?: string;     // Context where registered
    manufacturer?: string;     // Device manufacturer
    brand?: string;            // Device brand
    biometricType?: string;    // Type of biometric used
    [key: string]: any;        // Any other custom metadata
  };
}

// Return type
interface RegisterPasskeyResult {
  data: { 
    success: boolean; 
    rpName: string;            // Relying party name from server config 
    rpId: string;              // Relying party ID from server config
  } | null;
  error: Error | null;
}
```

#### `authenticateWithPasskey(options?): Promise<AuthenticatePasskeyResult>`

Authenticates a user with a registered passkey. Works across all platforms.

```typescript
interface AuthenticateOptions {
  userId?: string;             // Optional: User ID (for targeted authentication)
  rpId?: string;               // Optional: Relying Party ID (auto-detected on web)
  timeout?: number;            // Optional: Timeout in milliseconds
  userVerification?: "required" | "preferred" | "discouraged";
  metadata?: {                 // Optional: Additional metadata to update
    lastLocation?: string;     // Context where authentication occurred
    appVersion?: string;       // App version
    [key: string]: any;        // Any other custom metadata
  };
}

// Return type
interface AuthenticatePasskeyResult {
  data: { 
    token: string;             // Session token for authentication
    user: {                    // User object
      id: string;              // User ID
      email: string;           // User email
      [key: string]: any;      // Any other user properties
    };
  } | null;
  error: Error | null;
}
```

#### Platform Detection Functions

```typescript
// Check if passkeys are supported on current platform
const isSupported = await isPasskeySupported();

// Get platform-specific device information (mobile only)
if (Platform.OS !== 'web') {
  const deviceInfo = await getDeviceInfo();
  const biometricInfo = await getBiometricInfo();
}

// Check platform authenticator availability (web only)
if (Platform.OS === 'web') {
  const isAvailable = await isPlatformAuthenticatorAvailable();
}
```

### Server API

The server API remains the same as v0.1.x, with the key difference being the unified table structure that now supports all platforms in a single table.

## Database Schema

The plugin uses a unified table structure that works seamlessly across all platforms.

### authPasskey Table

| **Field Name**    | **Type**                | **Key** | **Description**                                      |
|-------------------|-------------------------|---------|------------------------------------------------------|
| `id`              | `string`                | PK      | Unique identifier for each passkey                   |
| `userId`          | `string`                | FK      | The ID of the user (references `user.id`)            |
| `credentialId`    | `string`                | UQ      | Unique identifier of the generated credential        |
| `publicKey`       | `string`                | -       | Base64 encoded public key                            |
| `counter`         | `number`                | -       | For WebAuthn signature verification                  |
| `platform`        | `string`                | -       | Platform on which the passkey is registered          |
| `lastUsed`        | `string`                | -       | Time the passkey was last used                       |
| `status`          | `string`                | -       | Status of the passkey (active/revoked)               |
| `createdAt`       | `string`                | -       | Time when the passkey was created                    |
| `updatedAt`       | `string`                | -       | Time when the passkey was last updated               |
| `revokedAt`       | `string` (optional)     | -       | Timestamp when the passkey was revoked (if any)      |
| `revokedReason`   | `string` (optional)     | -       | Reason for revocation (if any)                       |
| `metadata`        | `string` (JSON)         | -       | JSON string containing metadata about the device     |
| `aaguid`          | `string`                | -       | Authenticator Attestation Globally Unique Identifier |

### passkeyChallenge Table

| **Field Name**    | **Type**                | **Key** | **Description**                                      |
|-------------------|-------------------------|---------|------------------------------------------------------|
| `id`              | `string`                | PK      | Unique identifier for each challenge                 |
| `userId`          | `string`                | -       | The ID of the user                                   |
| `challenge`       | `string`                | -       | Base64url encoded challenge                          |
| `type`            | `string`                | -       | Type of challenge (registration/authentication)      |
| `createdAt`       | `string`                | -       | Time when the challenge was created                  |
| `expiresAt`       | `string`                | -       | Time when the challenge expires                      |

## Database Optimizations

Optimizing database performance is essential to get the best out of the Expo Passkey plugin.

### Recommended Fields to Index

- **Single field indexes**:
  - `userId`: For fast lookups of a user's passkeys.
  - `lastUsed`: For efficient sorting and cleanup operations.
  - `status`: For filtering by active/revoked status.
  - `credentialId`: For quick credential lookup during authentication.

- **Compound indexes**:
  - `(credentialId, status)`: Optimizes the authentication endpoint.
  - `(userId, status)`: Accelerates the passkey listing endpoint.
  - `(lastUsed, status)`: Improves performance of cleanup operations.

## Troubleshooting

### Web Issues

- **HTTPS Required**: WebAuthn only works over HTTPS in production
- **Browser Support**: Ensure the browser supports WebAuthn and platform authenticators
- **Same-Origin Policy**: Ensure your RP ID matches your domain
- **Platform Authenticator**: Some browsers may not have platform authenticators available

### iOS Issues

- **iOS Version Requirements**: Must be running iOS 16+ for passkey support
- **Biometric Setup**: Ensure Face ID/Touch ID is configured in device settings
- **Associated Domains**: Verify your apple-app-site-association file is accessible
- **App Configuration**: Check that associatedDomains is properly set in app.json
- **Simulator Limitations**: Biometric authentication in simulators requires additional setup:
  - In the simulator, go to Features → Face ID/Touch ID → Enrolled
  - When prompted, select "Matching Face/Fingerprint" for success testing

### Android Issues

- **API Level**: Must be running Android 10+ (API level 29+)
- **Biometric Hardware**: Device must have fingerprint or facial recognition hardware
- **Asset Links**: Ensure your assetlinks.json file is accessible and correctly formatted
- **Signing Certificates**: Make sure you're using the correct SHA-256 fingerprint
- **Origin Format**: Verify your android:apk-key-hash format in the server config

### Universal App Issues

- **Platform Detection**: The plugin automatically detects the platform, but you can manually check using `Platform.OS`
- **Import Issues**: The plugin uses platform-specific entry points to avoid importing incompatible modules
- **Metro Bundler**: Ensure your Metro configuration supports the export conditions in package.json

## Migration from v0.1.x

If you're upgrading from v0.1.x, you'll need to migrate your data:

### Database Migration

1. **Rename Table**: Rename `mobilePasskey` table to `authPasskey`
2. **Update References**: Update any custom code that references the old table name
3. **Unified Schema**: The new schema supports all platforms in a single table

### Code Changes

The API remains largely the same, but imports may change:

```typescript
// Old (v0.1.x)
import { expoPasskeyClient } from "expo-passkey";

// New (v0.2.x) - same import, but now works on web too!
import { expoPasskeyClient } from "expo-passkey";
```

## Security Considerations

- **Cross-Platform Security**: Passkeys maintain the same security properties across platforms
- **Domain Verification**: Ensure proper domain verification for both web and mobile
- **Portable Passkeys**: iCloud Keychain and Google Password Manager sync passkeys securely
- **Hardware Keys**: Support for hardware security keys across all platforms
- **Token Security**: Use HTTPS for all API communications
- **Rate Limiting**: Configure appropriate rate limits to prevent brute force attacks

## Error Handling

The package provides comprehensive error codes for all platforms:

```typescript
// Platform-agnostic error handling
try {
  const result = await authenticateWithPasskey();
  if (result.error) {
    if (result.error.code === ERROR_CODES.WEBAUTHN.NOT_SUPPORTED) {
      showPlatformNotSupportedMessage();
    } else if (result.error.code === ERROR_CODES.BIOMETRIC.AUTHENTICATION_FAILED) {
      showAuthFailedMessage();
    }
    return;
  }
  
  handleSuccessfulAuthentication(result.data);
} catch (error) {
  console.error("Unexpected error:", error);
}
```

## License

MIT

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related

- [Better Auth Documentation](https://www.better-auth.com/docs/integrations/expo)
- [Expo Local Authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [WebAuthn Guide](https://webauthn.guide/)
- [SimpleWebAuthn](https://simplewebauthn.dev/)
- [Apple Associated Domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains)
- [Android Asset Links](https://developers.google.com/digital-asset-links)
- [Neb Starter Example Project](https://github.com/iosazee/neb-starter)
# Expo Passkey

<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue" alt="Platform iOS | Android" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue" alt="TypeScript Ready" />
 <img src="https://img.shields.io/badge/Status-STABLE-brightgreen" alt="Stable Status" />
</p>

This is an Expo module as well as a Better Auth plugin to help you create and authenticate with passkeys in your Expo apps. Now in stable release, it's ready for production applications.

## 📱 Example Project

Check out our comprehensive example implementation at [neb-starter](https://github.com/iosazee/neb-starter), which demonstrates how to use Expo Passkey across a full-stack application:

- **Backend**: Built with Next.js, showcasing server-side implementation
- **Mobile App**: Complete Expo mobile client with passkey authentication
- **Working Demo**: See passkey registration and authentication in action
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
- [Quick Start](#quick-start)
- [Complete API Reference](#complete-api-reference)
- [Database Schema](#database-schema)
- [Database Optimizations](#database-optimizations)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [Error Handling](#error-handling)
- [Bugs and Known Issues](#bugs-and-known-issues)
- [License](#license)

## Overview

Expo Passkey bridges the gap between Better Auth's backend capabilities and native biometric authentication on mobile devices. It allows your users to authenticate securely using Face ID, Touch ID, or fingerprint recognition without passwords, providing a modern, frictionless authentication experience.

This plugin implements FIDO2-inspired passkey authentication by connecting Better Auth's backend infrastructure with Expo's client-side biometric capabilities, offering a complete end-to-end solution that you can integrate with minimal configuration.

## Key Features

- ✅ **Seamless Integration**: Works directly with Better Auth server and Expo client
- ✅ **Native Biometrics**: Leverages Face ID, Touch ID, and fingerprint authentication
- ✅ **Cross-Platform**: Full support for iOS (16+) and Android (10+)
- ✅ **Complete Lifecycle Management**: Registration, authentication, and revocation flows
- ✅ **Type-Safe API**: Comprehensive TypeScript definitions and autocomplete
- ✅ **Secure Device Binding**: Ensures keys are bound to specific devices
- ✅ **Database Integration**: Automatically creates a MobilePasskey model in your database
- ✅ **Automatic Cleanup**: Optional automatic revocation of unused passkeys
- ✅ **Rich Metadata**: Store and retrieve device-specific context with each passkey
- ✅ **Custom UI Hooks**: Simplifies integration in your React Native UI

## Platform Requirements

| Platform | Minimum Version | Biometric Requirements |
|----------|----------------|------------------------|
| iOS      | iOS 16+        | Face ID or Touch ID configured |
| Android  | Android 10+ (API level 29+) | Fingerprint or Face Recognition configured |

## Installation

### Client Installation
In your expo app:
```bash
# Install the package
npm i expo-passkey

# Install peer dependencies (if not already installed)
npx expo install expo-application expo-local-authentication expo-secure-store expo-crypto expo-device
```

### Server Installation
In your auth server:
```bash
# Install the package
npm i expo-passkey

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
```typescript
import { createAuthClient } from "better-auth/react";
import { expoPasskeyClient } from "expo-passkey";

export const { 
  registerPasskey, 
  authenticateWithPasskey,
  isPasskeySupported
} = createAuthClient({
  plugins: [expoPasskeyClient()]
});
```

## Looking for More?

For a complete working example of Expo Passkey implementation, explore our [neb-starter](https://github.com/iosazee/neb-starter) repository, which demonstrates:

- Server-side configuration in Next.js
- Client-side integration in Expo
- Registration and authentication flows
- Error handling and UI integration

## Complete API Reference

### Client API

#### `registerPasskey(options): Promise<RegisterPasskeyResult>`

Registers a new passkey for a user. This will prompt for biometric authentication.

```typescript
interface RegisterOptions {
  userId: string;              // Required: User ID to associate with the passkey
  deviceId?: string;           // Optional: Override automatic device ID 
  metadata?: {                 // Optional: Additional metadata to store
    deviceName?: string;       // Device name (e.g. "John's iPhone")
    deviceModel?: string;      // Device model (e.g. "iPhone 14 Pro")
    appVersion?: string;       // App version
    lastLocation?: string;     // Context where registered (e.g. "settings-screen")
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

Authenticates a user with a registered passkey. This will prompt for biometric authentication.

```typescript
interface AuthenticateOptions {
  deviceId?: string;           // Optional: Override automatic device ID
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

#### `listPasskeys(options): Promise<ListPasskeysResult>`

Lists all passkeys registered for a user. Useful for managing devices.

```typescript
interface ListOptions {
  userId: string;              // Required: User ID
  limit?: number;              // Optional: Pagination limit (default: 10)
  offset?: number;             // Optional: Pagination offset (default: 0)
}

// Return type
interface ListPasskeysResult {
  data: { 
    passkeys: Array<MobilePasskey>; // Array of passkey objects
    nextOffset?: number;       // Pagination offset for next page
  } | null;
  error: Error | null;
}

```

#### `revokePasskey(options): Promise<RevokePasskeyResult>`

Revokes a passkey, preventing it from being used for authentication.

```typescript
interface RevokeOptions {
  userId: string;              // Required: User ID
  deviceId?: string;           // Optional: Override automatic device ID
  reason?: string;             // Optional: Reason for revocation
}

// Return type
interface RevokePasskeyResult {
  data: { success: boolean } | null;
  error: Error | null;
}
```

#### `checkPasskeyRegistration(userId: string): Promise<PasskeyRegistrationCheckResult>`

Checks if the current device has a registered passkey for the given user.

```typescript
// Return type
interface PasskeyRegistrationCheckResult {
  isRegistered: boolean;       // Whether device has a registered passkey
  deviceId: string | null;     // Device ID
  biometricSupport: BiometricSupportInfo | null; // Biometric support info
  error: Error | null;         // Error if any
}
```


#### `hasPasskeyRegistered()`

Checks if the device has a valid registered passkey by verifying both device ID and user ID are present in secure storage.

```typescript
// Check if the current device has a registered passkey
const hasPasskey = await hasRegisteredPasskey();
if (hasPasskey) {
  console.log("This device has a registered passkey");
  //carry out some action eg conditionally show passkey login button
} else {
  console.log("No passkey registered on this device");
}
```

#### `getBiometricInfo(): Promise<DeviceInfo>`

Gets information about the device's biometric capabilities, platform, and configuration.

```typescript
// Return type
interface DeviceInfo {
  deviceId: string;            // Unique device identifier
  platform: "ios" | "android"; // Device platform
  model: string | null;        // Device model (e.g. "iPhone 14")
  manufacturer: string | null; // Device manufacturer (e.g. "Apple")
  osVersion: string;           // OS version (e.g. "16.0")
  appVersion: string;          // App version
  biometricSupport: {
    isSupported: boolean;      // Whether biometrics are supported
    isEnrolled: boolean;       // Whether biometrics are set up
    availableTypes: number[];  // Available authentication types
    authenticationType: string; // Human-readable type (e.g. "Face ID")
    error: string | null;      // Error message if any
    platformDetails: {         // Platform-specific details
      platform: string;
      version: string | number;
      apiLevel?: number | null; // Android API level
      manufacturer?: string | null;
      brand?: string | null;
    }
  };
}
```

#### `isPasskeySupported(): Promise<boolean>`

Checks if passkeys are supported on the current device based on platform, OS version, and biometric capabilities.

```typescript
// Returns: boolean
// true if the device supports passkeys, false otherwise
```

#### `getStorageKeys(): StorageKeys`

Gets the storage keys used by the plugin for secure storage.

```typescript
// Return type
interface StorageKeys {
  DEVICE_ID: string;           // Key for device ID in SecureStore
  STATE: string;               // Key for state in SecureStore
  USER_ID: string;             // Key for user ID in SecureStore
  CREDENTIAL_IDS: string;      // Key for credential IDs in SecureStore
}
```

### Server API

#### `expoPasskey(options): BetterAuthPlugin`

Creates a server-side plugin for handling passkey operations.

```typescript
interface ExpoPasskeyOptions {
  rpId: string;                // Required: Relying Party ID (domain)
  rpName: string;              // Required: Human-readable app name

  // Optional settings
  origin?: string | string[];  // Expected origins for WebAuthn verification
                              // For iOS: domain of the website associated with your app
                              // For Android: URI derived from the SHA-256 hash of the APK
                              // Format: "android:apk-key-hash:<sha256_hash>"
  
  logger?: {
    enabled?: boolean;         // Enable logging (default: true in dev)
    level?: "debug" | "info" | "warn" | "error"; // Log level
  };
  
  rateLimit?: {
    registerWindow?: number;   // Time window for rate limiting (seconds)
    registerMax?: number;      // Max registration attempts in window
    authenticateWindow?: number; // Time window for auth attempts
    authenticateMax?: number;  // Max auth attempts in window
  };
  
  cleanup?: {
    inactiveDays?: number;     // Days after which to revoke inactive passkeys
    disableInterval?: boolean; // Disable automatic cleanup (for serverless)
  };
}
```

## Database Schema

The plugin requires two new tables in the database to store passkey data.

### mobilePasskey Table

| **Field Name**    | **Type**                | **Key** | **Description**                                      |
|-------------------|-------------------------|---------|------------------------------------------------------|
| `id`              | `string`                | PK      | Unique identifier for each mobile passkey            |
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

### iOS Issues

- **iOS Version Requirements**: Must be running iOS 16+ for passkey support
- **Biometric Setup**: Ensure Face ID/Touch ID is configured in device settings
- **Associated Domains**: Verify your apple-app-site-association file is accessible
- **App Configuration**: Check that associatedDomains is properly set in app.json
- **Simulator Limitations**: Biometric authentication in simulators requires additional setup:
  - In the simulator, go to Features → Face ID/Touch ID → Enrolled
  - When prompted, select "Matching Face/Fingerprint" for success testing
- **Device ID Generation**: iOS uses vendor ID from `expo-application`
- **Device Changes**: If a user resets Face ID/Touch ID, passkeys need re-registration

### Android Issues

- **API Level**: Must be running Android 10+ (API level 29+)
- **Biometric Hardware**: Device must have fingerprint or facial recognition hardware
- **Asset Links**: Ensure your assetlinks.json file is accessible and correctly formatted
- **Signing Certificates**: Make sure you're using the correct SHA-256 fingerprint
- **Origin Format**: Verify your android:apk-key-hash format in the server config
- **Configuration**: Biometric authentication must be set up in device settings
- **Emulator Testing**: Configure fingerprint in emulator settings (AVD Manager):
  - In AVD settings, enable fingerprint
  - Use "adb -e emu finger touch 1" command to simulate fingerprint
- **Fragmentation**: Behavior may vary across manufacturers

## Security Considerations

- **Device Binding**: Passkeys are bound to specific devices for security
- **Biometric Data**: Biometric data never leaves the device
- **Token Security**: Use HTTPS for all API communications
- **Rate Limiting**: Configure appropriate rate limits to prevent brute force attacks
- **Automatic Cleanup**: Enable cleanup to revoke unused passkeys periodically
- **Multiple Devices**: Allow users to register multiple devices for convenience
- **Fallback Authentication**: Always provide alternate authentication methods
- **Revocation**: Users should be able to revoke passkeys from all devices
- **Metadata Handling**: Be careful with what you store in metadata to avoid privacy concerns

## Error Handling

The package provides specific error codes for different scenarios:

```typescript
// Environment errors
ERROR_CODES.ENVIRONMENT.NOT_SUPPORTED     // Device/platform not supported
ERROR_CODES.ENVIRONMENT.MODULE_NOT_FOUND  // Required Expo module missing

// Biometric errors
ERROR_CODES.BIOMETRIC.NOT_SUPPORTED       // Device lacks biometric hardware
ERROR_CODES.BIOMETRIC.NOT_ENROLLED        // Biometrics not set up on device
ERROR_CODES.BIOMETRIC.AUTHENTICATION_FAILED // User failed/cancelled verification

// Device errors
ERROR_CODES.DEVICE.ID_GENERATION_FAILED   // Could not generate device ID

// WebAuthn errors
ERROR_CODES.WEBAUTHN.NOT_SUPPORTED        // WebAuthn not supported
ERROR_CODES.WEBAUTHN.CANCELED             // User canceled operation
ERROR_CODES.WEBAUTHN.TIMEOUT              // Operation timed out
ERROR_CODES.WEBAUTHN.OPERATION_FAILED     // WebAuthn operation failed
ERROR_CODES.WEBAUTHN.NATIVE_MODULE_ERROR  // Error in native module

// Server errors
ERROR_CODES.SERVER.CREDENTIAL_EXISTS      // Passkey already registered
ERROR_CODES.SERVER.INVALID_CREDENTIAL     // Passkey not found
ERROR_CODES.SERVER.CREDENTIAL_NOT_FOUND   // Passkey doesn't exist
ERROR_CODES.SERVER.AUTHENTICATION_FAILED  // Authentication failed
ERROR_CODES.SERVER.USER_NOT_FOUND         // User not found
ERROR_CODES.SERVER.INVALID_ORIGIN         // Invalid origin
ERROR_CODES.SERVER.VERIFICATION_FAILED    // WebAuthn verification failed
```

Example error handling pattern:

```typescript
try {
  const result = await authenticateWithPasskey();
  if (result.error) {
    // Handle specific error types
    if (result.error.code === ERROR_CODES.BIOMETRIC.AUTHENTICATION_FAILED) {
      showAuthFailedMessage();
    } else if (result.error.code === ERROR_CODES.SERVER.INVALID_CREDENTIAL) {
      promptReregistration();
    } else {
      // Generic error handling
      showErrorMessage(result.error.message);
    }
    return;
  }
  
  // Handle success
  handleSuccessfulAuthentication(result.data);
} catch (error) {
  // Catch unexpected errors
  console.error("Unexpected error:", error);
  showGenericErrorMessage();
}
```

## Bugs and Known Issues

This package is now in stable release, meaning it's considered production-ready and has been thoroughly tested in real-world applications. However, we still encourage you to report any issues you encounter on our [Github issues page](https://github.com/iosazee/expo-passkey/issues).

There are a few platform limitations to be aware of:

- **Expo Go Limitations**: Due to how Expo Go manages native modules, passkey functionality requires a development build or production build
- **Android Compatibility**: Some Android devices may not support passkeys despite meeting the API level requirements
- **iOS Simulator**: Biometric authentication in iOS simulators may not work consistently
- **Storage Persistence**: On some devices, SecureStore may be cleared when app is uninstalled

We appreciate your feedback as we continue to improve the library.

## License

MIT

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related

- [Better Auth Documentation](https://www.better-auth.com/docs/integrations/expo)
- [Expo Local Authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [FIDO2 WebAuthn](https://webauthn.guide/)
- [Apple Associated Domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains)
- [Android Asset Links](https://developers.google.com/digital-asset-links)
- [Neb Starter Example Project](https://github.com/iosazee/neb-starter)
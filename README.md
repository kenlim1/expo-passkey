# Expo Passkey

<img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue" alt="Platform iOS | Android" />
<img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
<img src="https://img.shields.io/badge/TypeScript-Ready-blue" alt="TypeScript Ready" />

A Better Auth plugin enabling secure, passwordless authentication in Expo applications through native biometric authentication.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Platform Requirements](#platform-requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [Error Handling](#error-handling)
-[Bugs](#bugs-and-known-issues)
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
- ✅ **Automatic Cleanup**: Optional automatic revocation of unused passkeys
- ✅ **Rich Metadata**: Store and retrieve device-specific context with each passkey

## Platform Requirements

| Platform | Minimum Version | Biometric Requirements |
|----------|----------------|------------------------|
| iOS      | iOS 16+        | Face ID or Touch ID configured |
| Android  | Android 10+ (API level 29+) | Fingerprint or Face Recognition configured |

## Installation

### Client Installation

```bash
# Install the package
npm i expo-passkey

# Install peer dependencies (if not already installed)
npx expo install expo-application expo-local-authentication expo-secure-store expo-crypto expo-device
```

### Server Installation

```bash
# Install the package
npm i expo-passkey

# Install peer dependencies (if not already installed)
npm install better-auth zod better-fetch
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
      rpName: "Your App Name"
    })
  ]
});
```

2. **Add to Client**:
```typescript
import { createAuthClient } from "better-auth/client";
import { expoPasskeyClient } from "expo-passkey";

export const { 
  registerPasskey, 
  authenticateWithPasskey,
  isPasskeySupported
} = createAuthClient({
  plugins: [expoPasskeyClient()]
});
```

3. **Implement Authentication**:
```tsx
function PasskeyButton() {
  const handleAuth = async () => {
    const supported = await isPasskeySupported();
    if (!supported) {
      Alert.alert("Your device doesn't support passkeys");
      return;
    }
    
    try {
      const result = await authenticateWithPasskey();
      if (result.data) {
        // Authentication successful
        console.log("Authenticated user:", result.data.user);
      }
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  };

  return <Button title="Sign in with Face ID" onPress={handleAuth} />;
}
```

## Detailed Setup

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { expoPasskey } from "expo-passkey/server";

export const auth = betterAuth({
  // Other auth config...
  plugins: [
    // Other plugins...
    expoPasskey({
      rpId: "example.com",       // Required: Domain identifier
      rpName: "Your App Name",   // Required: Human-readable app name
      
      // Optional settings
      logger: {
        enabled: true,           // Enable detailed logging (default: true in dev)
        level: "debug",          // Log level: "debug", "info", "warn", "error"
      },
      rateLimit: {
        registerWindow: 300,     // Time window in seconds for rate limiting
        registerMax: 3,          // Max registration attempts in window
        authenticateWindow: 60,  // Time window for auth attempts
        authenticateMax: 5,      // Max auth attempts in window
      },
      cleanup: {
        inactiveDays: 30,        // Auto-revoke passkeys after 30 days of inactivity
        disableInterval: false,  // Set to true in serverless environments
      },
    }),
  ],
});
```

### Client Configuration

```typescript
import { createAuthClient } from "better-auth/client";
import { expoPasskeyClient } from "expo-passkey";

export const authClient = createAuthClient({
  baseURL: "https://api.example.com", // Your API base URL
  plugins: [
    expoPasskeyClient({
      storagePrefix: "your-app", // Optional storage key prefix (default: "_better-auth")
    }),
  ],
});

// Export actions for use throughout your app
export const {
  registerPasskey,
  authenticateWithPasskey,
  listPasskeys,
  revokePasskey,
  getBiometricInfo,
  isPasskeySupported,
  checkPasskeyRegistration,
  getStorageKeys,
} = authClient;
```

## Usage Examples

### Checking Device Compatibility

```typescript
import { isPasskeySupported, getBiometricInfo } from "./auth-client";

// Check if device supports passkeys
const supported = await isPasskeySupported();

if (supported) {
  // Get detailed information about biometric capabilities
  const deviceInfo = await getBiometricInfo();
  console.log(`Device supports ${deviceInfo.biometricSupport.authenticationType}`);
}
```

### Registering a New Passkey

```typescript
import { registerPasskey } from "./auth-client";

// Register a passkey for the user
// Will prompt for biometric verification
const result = await registerPasskey({
  userId: "user-123",
  metadata: {
    deviceName: "My iPhone",
    lastLocation: "registration-screen",
  },
});

if (result.error) {
  console.error("Registration failed:", result.error.message);
} else {
  console.log("Passkey registered successfully");
}
```

### Authenticating with a Passkey

```typescript
import { authenticateWithPasskey } from "./auth-client";

try {
  // Will prompt for biometric verification
  const result = await authenticateWithPasskey({
    metadata: {
      lastLocation: "login-screen",
    }
  });

  if (result.error) throw result.error;
  
  // Authentication successful
  const { user, token } = result.data;
  console.log("Authenticated user:", user);
  
  // Use token for authenticated API requests
  // ...
} catch (error) {
  console.error("Authentication failed:", error.message);
}
```

### Managing Passkeys

```typescript
import { listPasskeys, revokePasskey, getBiometricInfo } from "./auth-client";

// Get current device ID
const deviceInfo = await getBiometricInfo();
const currentDeviceId = deviceInfo.deviceId;

// List all passkeys for the user
const listResult = await listPasskeys({ 
  userId: "user-123",
  limit: 10,
  offset: 0
});

if (listResult.data) {
  const passkeys = listResult.data.passkeys;
  console.log(`Found ${passkeys.length} passkeys`);
  
  // Identify current device's passkey
  const currentDevicePasskey = passkeys.find(pk => pk.deviceId === currentDeviceId);
  if (currentDevicePasskey) {
    console.log("This device has a registered passkey");
  }
}

// Revoke a passkey
const revokeResult = await revokePasskey({
  userId: "user-123",
  deviceId: "device-to-revoke",
  reason: "user_requested"
});

if (revokeResult.data?.success) {
  console.log("Passkey successfully revoked");
}
```

### Basic Custom Hook

```typescript
import { useState, useEffect } from "react";
import { isPasskeySupported, checkPasskeyRegistration } from "./auth-client";

function usePasskeyStatus(userId) {
  const [isSupported, setIsSupported] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        setLoading(true);
        
        // Check device support
        const supported = await isPasskeySupported();
        setIsSupported(supported);
        
        if (supported && userId) {
          // Check if device has registered passkey
          const result = await checkPasskeyRegistration(userId);
          setHasPasskey(result.isRegistered);
        }
      } catch (error) {
        console.error("Error checking passkey status:", error);
      } finally {
        setLoading(false);
      }
    }
    
    checkStatus();
  }, [userId]);

  return { isSupported, hasPasskey, loading };
}
```

## API Reference

### Client API

#### `registerPasskey(options)`

Registers a new passkey for a user.

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
  };
}

// Return value
interface RegisterResult {
  data: { 
    success: boolean; 
    rpName: string;            // Relying party name from server config 
    rpId: string;              // Relying party ID from server config
  } | null;
  error: Error | null;
}
```

#### `authenticateWithPasskey(options?)`

Authenticates a user with a registered passkey.

```typescript
interface AuthenticateOptions {
  deviceId?: string;           // Optional: Override device ID
  metadata?: {                 // Optional: Additional metadata to update
    lastLocation?: string;     // Context where authentication occurred
    appVersion?: string;       // App version
    // ...other metadata fields
  };
}

// Return value 
interface AuthenticateResult {
  data: { 
    token: string;             // Session token
    user: User;                // User object
  } | null;
  error: Error | null;
}
```

#### `listPasskeys(options)`

Lists passkeys registered for a user.

```typescript
interface ListOptions {
  userId: string;              // Required: User ID
  limit?: number;              // Optional: Pagination limit
  offset?: number;             // Optional: Pagination offset
}

// Return value
interface ListResult {
  data: { 
    passkeys: Array<{
      id: string;              // Passkey ID
      userId: string;          // User ID
      deviceId: string;        // Device ID  
      platform: string;        // Platform (ios/android)
      lastUsed: string;        // ISO timestamp
      status: "active" | "revoked";
      createdAt: string;       // ISO timestamp
      updatedAt: string;       // ISO timestamp
      metadata: any;           // Parsed metadata
    }>;
    nextOffset?: number;       // Pagination offset for next page
  } | null;
  error: Error | null;
}
```

#### `revokePasskey(options)`

Revokes a passkey.

```typescript
interface RevokeOptions {
  userId: string;              // Required: User ID
  deviceId?: string;           // Optional: Override device ID
  reason?: string;             // Optional: Reason for revocation
}

// Return value
interface RevokeResult {
  data: { success: boolean } | null;
  error: Error | null;
}
```

#### `getBiometricInfo()`

Gets information about the device's biometric capabilities.

```typescript
// Return value
interface DeviceInfo {
  deviceId: string;            // Unique device identifier
  platform: "ios" | "android"; // Device platform
  model: string | null;        // Device model
  manufacturer: string | null; // Device manufacturer
  osVersion: string;           // OS version
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
      apiLevel?: number | null;
      manufacturer?: string | null;
      brand?: string | null;
    }
  };
}
```

#### `isPasskeySupported()`

Checks if passkeys are supported on the current device.

```typescript
// Returns: boolean
// true if device supports passkeys, false otherwise
```

#### `checkPasskeyRegistration(userId: string)`

Checks if the current device has a registered passkey for the given user.

```typescript
// Return value
interface PasskeyRegistrationCheckResult {
  isRegistered: boolean;       // Whether device has a registered passkey
  deviceId: string | null;     // Device ID
  biometricSupport: BiometricSupportInfo | null; // Biometric support info
  error: Error | null;         // Error if any
}
```

#### `getStorageKeys()`

Gets the storage keys used by the plugin.

```typescript
// Returns
interface StorageKeys {
  DEVICE_ID: string;           // Key for device ID in SecureStore
  STATE: string;               // Key for state in SecureStore
  USER_ID: string;             // Key for user ID in SecureStore
}
```

## Troubleshooting

### iOS Issues

- **iOS Version Requirements**: Must be running iOS 16+ for passkey support
- **Biometric Setup**: Ensure Face ID/Touch ID is configured in device settings
- **Simulator Limitations**: Biometric authentication in simulators may be limited
- **Device ID Generation**: iOS uses vendor ID from `expo-application`
- **Device Changes**: If a user resets Face ID/Touch ID, passkeys need re-registration

### Android Issues

- **API Level**: Must be running Android 10+ (API level 29+)
- **Biometric Hardware**: Device must have fingerprint or facial recognition hardware
- **Configuration**: Biometric authentication must be set up in device settings
- **Emulator Testing**: Configure fingerprint in emulator settings (AVD Manager)
- **Fragmentation**: Behavior may vary across manufacturers

### General Troubleshooting

1. **Device Compatibility Check**:
   ```javascript
   const info = await getBiometricInfo();
   console.log(JSON.stringify(info, null, 2));
   ```

2. **Storage Check**:
   ```javascript
   import * as SecureStore from 'expo-secure-store';
   const keys = getStorageKeys();
   const deviceId = await SecureStore.getItemAsync(keys.DEVICE_ID);
   console.log("Current Device ID:", deviceId);
   ```

3. **Clear Device ID** (for testing):
   ```javascript
   import * as SecureStore from 'expo-secure-store';
   const keys = getStorageKeys();
   await SecureStore.deleteItemAsync(keys.DEVICE_ID);
   ```

4. **Server Logs**: Enable debug logging on the server:
   ```javascript
   expoPasskey({
     // ...other options
     logger: { enabled: true, level: "debug" }
   })
   ```

## Security Considerations

- **Device Binding**: Passkeys are bound to specific devices for security
- **Biometric Data**: Biometric data never leaves the device
- **Token Security**: Use HTTPS for all API communications
- **Rate Limiting**: Configure appropriate rate limits to prevent brute force attacks
- **Automatic Cleanup**: Enable cleanup to revoke unused passkeys periodically
- **Multiple Devices**: Allow users to register multiple devices for convenience
- **Fallback Authentication**: Always provide alternate authentication methods

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

// Server errors
ERROR_CODES.SERVER.CREDENTIAL_EXISTS      // Passkey already registered
ERROR_CODES.SERVER.INVALID_CREDENTIAL     // Passkey not found
ERROR_CODES.SERVER.CREDENTIAL_NOT_FOUND   // Passkey doesn't exist
ERROR_CODES.SERVER.AUTHENTICATION_FAILED  // Authentication failed
ERROR_CODES.SERVER.USER_NOT_FOUND         // User not found
```

## Bugs and known issues
As the package is currently in beta, there may be unexpected bugs or incomplete features. Please report any issues you encounter on our [Github issues page](https://github.com/iosazee/expo-passkey/issues). Known issues include
 - Expo go limitations.
We appreciate your feedback and contributions to improve stability and functionality.

## License

MIT

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related

- [Better Auth Documentation](https://www.better-auth.com/docs/integrations/expo)
- [Expo Local Authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [FIDO2 WebAuthn](https://webauthn.guide/)
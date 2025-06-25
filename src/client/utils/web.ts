/**
 * @file Web-specific utilities for WebAuthn. Runs only in web environments.
 * @module expo-passkey/client/utils/web
 */

// Type imports
import type {
  AuthenticatorSelectionCriteria,
  PublicKeyCredentialType,
  AttestationConveyancePreference,
  UserVerificationRequirement,
  COSEAlgorithmIdentifier,
} from "../../types";

import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  AuthenticatorTransportFuture,
  Base64URLString,
} from "@simplewebauthn/types";

// Static import - safe since this file only runs in web environments
import * as webAuthnBrowser from "@simplewebauthn/browser";

/**
 * Get WebAuthn browser module (now statically imported)
 */
export function getWebAuthnBrowser() {
  return webAuthnBrowser;
}

/**
 * Check if a string is already base64url encoded
 * Uses a conservative approach to avoid false positives with human-readable strings
 */
function isBase64URLEncoded(str: string): boolean {
  // Must only contain valid base64url characters
  if (!/^[A-Za-z0-9_-]+$/.test(str)) {
    return false;
  }

  // Require minimum length but not too restrictive
  if (str.length < 4) {
    return false;
  }

  const hasUpperAndLower = /[a-z]/.test(str) && /[A-Z]/.test(str);
  const hasBase64UrlChars = /_/.test(str) || (str.match(/-/g) || []).length > 1;
  const looksHuman =
    /^[a-z]+-[0-9]+$/i.test(str) ||
    /^[a-z]+[0-9]+$/i.test(str) ||
    /^[0-9]+-[a-z]+$/i.test(str);

  // If it looks like a human-readable pattern, don't treat as base64url
  if (looksHuman) {
    return false;
  }

  // If it has characteristics of base64url, validate by decoding
  if (hasUpperAndLower || hasBase64UrlChars) {
    try {
      let base64 = str;
      // Convert base64url to base64
      base64 = base64.replace(/-/g, "+").replace(/_/g, "/");

      // Add padding if needed
      const remainder = base64.length % 4;
      if (remainder > 0) {
        base64 = base64.padEnd(base64.length + 4 - remainder, "=");
      }

      // Try to decode (works in both browser and Node.js for testing)
      if (typeof atob !== "undefined") {
        atob(base64); // Browser environment
      } else {
        Buffer.from(base64, "base64"); // Node.js environment (testing)
      }

      return true;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Convert a string to Base64URL format (for SimpleWebAuthn compatibility)
 */
function toBase64URLString(str: string): Base64URLString {
  // If it's already base64url encoded, return as is
  if (isBase64URLEncoded(str)) {
    return str as Base64URLString;
  }

  // Convert to base64url
  let base64: string;

  if (typeof btoa !== "undefined") {
    // Browser environment
    base64 = btoa(str);
  } else {
    // Node.js environment (for testing)
    base64 = Buffer.from(str, "utf8").toString("base64");
  }

  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "") as Base64URLString;
}

/**
 * Create registration options for web (SimpleWebAuthn JSON format)
 */
export function createWebRegistrationOptions(
  challenge: string,
  userId: string,
  userName: string,
  displayName: string,
  rpId: string,
  rpName: string,
  options?: {
    timeout?: number;
    attestation?: AttestationConveyancePreference;
    authenticatorSelection?: AuthenticatorSelectionCriteria;
    excludeCredentials?: Array<{ id: string; type: "public-key" }>;
  },
): PublicKeyCredentialCreationOptionsJSON {
  return {
    rp: {
      id: rpId,
      name: rpName,
    },
    user: {
      id: toBase64URLString(userId),
      name: userName,
      displayName: displayName,
    },
    challenge: toBase64URLString(challenge),
    pubKeyCredParams: [
      {
        type: "public-key" as PublicKeyCredentialType,
        alg: -7 as COSEAlgorithmIdentifier, // ES256
      },
      {
        type: "public-key" as PublicKeyCredentialType,
        alg: -257 as COSEAlgorithmIdentifier, // RS256
      },
    ],
    timeout: options?.timeout ?? 60000,
    authenticatorSelection: options?.authenticatorSelection ?? {
      authenticatorAttachment: "platform",
      userVerification: "preferred",
      residentKey: "preferred",
    },
    attestation: options?.attestation ?? "none",
    excludeCredentials:
      options?.excludeCredentials?.map((cred) => ({
        id: toBase64URLString(cred.id),
        type: cred.type as PublicKeyCredentialType,
        transports: ["internal"] as AuthenticatorTransportFuture[],
      })) ?? [],
  };
}

/**
 * Create authentication options for web (SimpleWebAuthn JSON format)
 */
export function createWebAuthenticationOptions(
  challenge: string,
  rpId: string,
  options?: {
    timeout?: number;
    userVerification?: UserVerificationRequirement;
    allowCredentials?: Array<{ id: string; type: "public-key" }>;
  },
): PublicKeyCredentialRequestOptionsJSON {
  return {
    challenge: toBase64URLString(challenge),
    rpId,
    timeout: options?.timeout ?? 60000,
    userVerification: options?.userVerification ?? "preferred",
    allowCredentials:
      options?.allowCredentials?.map((cred) => ({
        id: toBase64URLString(cred.id),
        type: cred.type as PublicKeyCredentialType,
        transports: ["internal", "hybrid"] as AuthenticatorTransportFuture[],
      })) ?? [],
  };
}

/**
 * Check if WebAuthn is supported in the current browser
 */
export function isWebAuthnSupportedInBrowser(): boolean {
  return !!(
    typeof window !== "undefined" &&
    window?.PublicKeyCredential &&
    typeof window.PublicKeyCredential === "function"
  );
}

/**
 * Check if platform authenticator is available in the browser
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupportedInBrowser()) {
    return false;
  }

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Browser-specific error messages
 */
export const WEB_ERROR_MESSAGES = {
  NOT_SECURE_CONTEXT: "WebAuthn requires a secure context (HTTPS)",
  BROWSER_NOT_SUPPORTED: "Your browser does not support WebAuthn",
  PLATFORM_AUTHENTICATOR_NOT_AVAILABLE: "No platform authenticator available",
} as const;

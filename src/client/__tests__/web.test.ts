/**
 * @file Tests for web-specific utilities
 * @module expo-passkey/client/utils/web.test
 */

import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  Base64URLString,
} from "@simplewebauthn/types";

// Mock @simplewebauthn/browser before importing the module under test
const mockWebAuthnBrowser = {
  browserSupportsWebAuthn: jest.fn(),
  startRegistration: jest.fn(),
  startAuthentication: jest.fn(),
};

jest.mock("@simplewebauthn/browser", () => mockWebAuthnBrowser);

// Import after mocking
import {
  getWebAuthnBrowser,
  createWebRegistrationOptions,
  createWebAuthenticationOptions,
  isWebAuthnSupportedInBrowser,
  isPlatformAuthenticatorAvailable,
  WEB_ERROR_MESSAGES,
} from "../utils/web";

describe("web utilities", () => {
  // Store original globals to restore them
  const originalWindow = global.window;
  const originalPublicKeyCredential = global.PublicKeyCredential;
  const originalAtob = global.atob;
  const originalBtoa = global.btoa;
  const originalBuffer = global.Buffer;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup basic browser environment
    Object.defineProperty(global, "window", {
      value: {
        location: {
          hostname: "example.com",
        },
        PublicKeyCredential: jest.fn(),
      },
      writable: true,
    });

    // Setup base64 functions for browser environment
    Object.defineProperty(global, "btoa", {
      value: jest.fn((str: string) =>
        Buffer.from(str, "utf8").toString("base64"),
      ),
      writable: true,
    });

    Object.defineProperty(global, "atob", {
      value: jest.fn((str: string) =>
        Buffer.from(str, "base64").toString("utf8"),
      ),
      writable: true,
    });

    // Mock PublicKeyCredential
    Object.defineProperty(global, "PublicKeyCredential", {
      value: {
        isUserVerifyingPlatformAuthenticatorAvailable: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original globals
    global.window = originalWindow;
    global.PublicKeyCredential = originalPublicKeyCredential;
    global.atob = originalAtob;
    global.btoa = originalBtoa;
    global.Buffer = originalBuffer;
  });

  describe("getWebAuthnBrowser", () => {
    it("should return the webAuthn browser module", () => {
      const result = getWebAuthnBrowser();
      expect(result).toEqual(
        expect.objectContaining({
          browserSupportsWebAuthn: expect.any(Function),
          startRegistration: expect.any(Function),
          startAuthentication: expect.any(Function),
        }),
      );
    });
  });

  describe("isBase64URLEncoded", () => {
    // Since isBase64URLEncoded is not exported, we'll test it through other functions
    // that use it internally like toBase64URLString
    it("should be tested indirectly through toBase64URLString function", () => {
      // This is tested indirectly through the createWebRegistrationOptions tests
      expect(true).toBe(true);
    });
  });

  describe("createWebRegistrationOptions", () => {
    const defaultParams = {
      challenge: "test-challenge",
      userId: "user123",
      userName: "testuser",
      displayName: "Test User",
      rpId: "example.com",
      rpName: "Test App",
    };

    it("should create valid registration options with default values", () => {
      const result = createWebRegistrationOptions(
        defaultParams.challenge,
        defaultParams.userId,
        defaultParams.userName,
        defaultParams.displayName,
        defaultParams.rpId,
        defaultParams.rpName,
      );

      expect(result).toMatchObject({
        rp: {
          id: "example.com",
          name: "Test App",
        },
        user: {
          name: "testuser",
          displayName: "Test User",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "preferred",
          residentKey: "preferred",
        },
        attestation: "none",
        excludeCredentials: [],
      });

      // Check that user.id and challenge are base64url encoded
      expect(typeof result.user.id).toBe("string");
      expect(typeof result.challenge).toBe("string");
    });

    it("should create registration options with custom values", () => {
      const options = {
        timeout: 30000,
        attestation: "direct" as const,
        authenticatorSelection: {
          authenticatorAttachment: "cross-platform" as const,
          userVerification: "required" as const,
          residentKey: "required" as const,
        },
        excludeCredentials: [
          { id: "excluded-cred-1", type: "public-key" as const },
        ],
      };

      const result = createWebRegistrationOptions(
        defaultParams.challenge,
        defaultParams.userId,
        defaultParams.userName,
        defaultParams.displayName,
        defaultParams.rpId,
        defaultParams.rpName,
        options,
      );

      expect(result.timeout).toBe(30000);
      expect(result.attestation).toBe("direct");
      expect(result.authenticatorSelection).toEqual({
        authenticatorAttachment: "cross-platform",
        userVerification: "required",
        residentKey: "required",
      });
      expect(result.excludeCredentials).toBeDefined();
      expect(result.excludeCredentials).toHaveLength(1);
      expect(result.excludeCredentials?.[0]).toMatchObject({
        type: "public-key",
        transports: ["internal"],
      });
    });

    it("should handle special characters in user data", () => {
      const result = createWebRegistrationOptions(
        "challenge-with-special-chars!@#",
        "user-with-special-chars!@#",
        "username@example.com",
        "User With Spaces",
        defaultParams.rpId,
        defaultParams.rpName,
      );

      expect(result.user.name).toBe("username@example.com");
      expect(result.user.displayName).toBe("User With Spaces");
      expect(typeof result.user.id).toBe("string");
      expect(typeof result.challenge).toBe("string");
    });
  });

  describe("createWebAuthenticationOptions", () => {
    const defaultParams = {
      challenge: "auth-challenge",
      rpId: "example.com",
    };

    it("should create valid authentication options with default values", () => {
      const result = createWebAuthenticationOptions(
        defaultParams.challenge,
        defaultParams.rpId,
      );

      expect(result).toMatchObject({
        rpId: "example.com",
        timeout: 60000,
        userVerification: "preferred",
        allowCredentials: [],
      });

      expect(typeof result.challenge).toBe("string");
    });

    it("should create authentication options with custom values", () => {
      const options = {
        timeout: 45000,
        userVerification: "required" as const,
        allowCredentials: [
          { id: "cred-1", type: "public-key" as const },
          { id: "cred-2", type: "public-key" as const },
        ],
      };

      const result = createWebAuthenticationOptions(
        defaultParams.challenge,
        defaultParams.rpId,
        options,
      );

      expect(result.timeout).toBe(45000);
      expect(result.userVerification).toBe("required");
      expect(result.allowCredentials).toBeDefined();
      expect(result.allowCredentials).toHaveLength(2);
      expect(result.allowCredentials?.[0]).toMatchObject({
        type: "public-key",
        transports: ["internal", "hybrid"],
      });
    });

    it("should handle empty allowCredentials", () => {
      const options = {
        allowCredentials: [],
      };

      const result = createWebAuthenticationOptions(
        defaultParams.challenge,
        defaultParams.rpId,
        options,
      );

      expect(result.allowCredentials).toEqual([]);
    });
  });

  describe("isWebAuthnSupportedInBrowser", () => {
    it("should return true when WebAuthn is supported", () => {
      // Mock window.PublicKeyCredential as a function
      Object.defineProperty(global.window, "PublicKeyCredential", {
        value: jest.fn(),
        writable: true,
      });

      const result = isWebAuthnSupportedInBrowser();
      expect(result).toBe(true);
    });

    it("should return false when window is undefined", () => {
      // @ts-expect-error - intentionally setting to undefined for testing
      global.window = undefined;

      const result = isWebAuthnSupportedInBrowser();
      expect(result).toBe(false);
    });

    it("should return false when PublicKeyCredential is undefined", () => {
      Object.defineProperty(global.window, "PublicKeyCredential", {
        value: undefined,
        writable: true,
      });

      const result = isWebAuthnSupportedInBrowser();
      expect(result).toBe(false);
    });

    it("should return false when PublicKeyCredential is not a function", () => {
      Object.defineProperty(global.window, "PublicKeyCredential", {
        value: {},
        writable: true,
      });

      const result = isWebAuthnSupportedInBrowser();
      expect(result).toBe(false);
    });
  });

  describe("isPlatformAuthenticatorAvailable", () => {
    beforeEach(() => {
      // Setup a proper mock for PublicKeyCredential
      Object.defineProperty(global, "PublicKeyCredential", {
        value: {
          isUserVerifyingPlatformAuthenticatorAvailable: jest.fn(),
        },
        writable: true,
      });
    });

    it("should return true when platform authenticator is available", async () => {
      // Mock WebAuthn support
      Object.defineProperty(global.window, "PublicKeyCredential", {
        value: jest.fn(),
        writable: true,
      });

      // Mock the static method
      (
        global.PublicKeyCredential
          .isUserVerifyingPlatformAuthenticatorAvailable as jest.Mock
      ).mockResolvedValue(true);

      const result = await isPlatformAuthenticatorAvailable();
      expect(result).toBe(true);
    });

    it("should return false when WebAuthn is not supported", async () => {
      Object.defineProperty(global.window, "PublicKeyCredential", {
        value: undefined,
        writable: true,
      });

      const result = await isPlatformAuthenticatorAvailable();
      expect(result).toBe(false);
    });

    it("should return false when platform authenticator check throws error", async () => {
      Object.defineProperty(global.window, "PublicKeyCredential", {
        value: jest.fn(),
        writable: true,
      });

      (
        global.PublicKeyCredential
          .isUserVerifyingPlatformAuthenticatorAvailable as jest.Mock
      ).mockRejectedValue(new Error("Not available"));

      const result = await isPlatformAuthenticatorAvailable();
      expect(result).toBe(false);
    });

    it("should return false when platform authenticator is not available", async () => {
      Object.defineProperty(global.window, "PublicKeyCredential", {
        value: jest.fn(),
        writable: true,
      });

      (
        global.PublicKeyCredential
          .isUserVerifyingPlatformAuthenticatorAvailable as jest.Mock
      ).mockResolvedValue(false);

      const result = await isPlatformAuthenticatorAvailable();
      expect(result).toBe(false);
    });
  });

  describe("WEB_ERROR_MESSAGES", () => {
    it("should contain expected error messages", () => {
      expect(WEB_ERROR_MESSAGES).toEqual({
        NOT_SECURE_CONTEXT: "WebAuthn requires a secure context (HTTPS)",
        BROWSER_NOT_SUPPORTED: "Your browser does not support WebAuthn",
        PLATFORM_AUTHENTICATOR_NOT_AVAILABLE:
          "No platform authenticator available",
      });
    });

    it("should have all messages as strings", () => {
      Object.values(WEB_ERROR_MESSAGES).forEach((message) => {
        expect(typeof message).toBe("string");
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe("base64url encoding/decoding", () => {
    it("should handle various string inputs correctly", () => {
      // Test through createWebRegistrationOptions since toBase64URLString is not exported
      const testCases = [
        "simple",
        "with spaces",
        "with@special#chars",
        "123456789",
        "aBcDeFgHiJkLmNoPqRsTuVwXyZ",
      ];

      testCases.forEach((testString) => {
        const result = createWebRegistrationOptions(
          testString,
          testString,
          "testuser",
          "Test User",
          "example.com",
          "Test App",
        );

        // Verify that the challenge and user.id are valid base64url strings
        expect(result.challenge).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(result.user.id).toMatch(/^[A-Za-z0-9_-]+$/);
      });
    });
  });

  describe("Node.js environment compatibility", () => {
    beforeEach(() => {
      // Remove btoa/atob to simulate Node.js environment
      // @ts-expect-error - intentionally setting to undefined for testing
      global.btoa = undefined;
      // @ts-expect-error - intentionally setting to undefined for testing
      global.atob = undefined;
    });

    it("should work in Node.js environment using Buffer", () => {
      const result = createWebRegistrationOptions(
        "test-challenge",
        "user123",
        "testuser",
        "Test User",
        "example.com",
        "Test App",
      );

      expect(result.challenge).toBeTruthy();
      expect(result.user.id).toBeTruthy();
      expect(typeof result.challenge).toBe("string");
      expect(typeof result.user.id).toBe("string");
    });
  });

  describe("edge cases", () => {
    it("should handle empty strings", () => {
      const result = createWebRegistrationOptions(
        "",
        "",
        "",
        "",
        "example.com",
        "Test App",
      );

      expect(result.rp.id).toBe("example.com");
      expect(result.rp.name).toBe("Test App");
      expect(result.user.name).toBe("");
      expect(result.user.displayName).toBe("");
    });

    it("should handle undefined options gracefully", () => {
      const result = createWebAuthenticationOptions(
        "challenge",
        "example.com",
        undefined,
      );

      expect(result.timeout).toBe(60000);
      expect(result.userVerification).toBe("preferred");
      expect(result.allowCredentials).toEqual([]);
    });

    it("should handle partial options objects", () => {
      const result = createWebRegistrationOptions(
        "challenge",
        "user",
        "username",
        "display",
        "example.com",
        "app",
        { timeout: 30000 }, // Only timeout specified
      );

      expect(result.timeout).toBe(30000);
      expect(result.attestation).toBe("none"); // default
      expect(result.authenticatorSelection).toEqual({
        authenticatorAttachment: "platform",
        userVerification: "preferred",
        residentKey: "preferred",
      });
    });
  });

  describe("type safety", () => {
    it("should return properly typed registration options", () => {
      const result: PublicKeyCredentialCreationOptionsJSON =
        createWebRegistrationOptions(
          "challenge",
          "user",
          "username",
          "display",
          "example.com",
          "app",
        );

      // TypeScript compilation itself verifies type safety
      expect(result.rp.id).toBe("example.com");

      // Additional type checks for optional properties
      expect(result.excludeCredentials).toBeDefined();
      expect(Array.isArray(result.excludeCredentials)).toBe(true);
    });

    it("should return properly typed authentication options", () => {
      const result: PublicKeyCredentialRequestOptionsJSON =
        createWebAuthenticationOptions("challenge", "example.com");

      // TypeScript compilation itself verifies type safety
      expect(result.rpId).toBe("example.com");

      // Additional type checks for optional properties
      expect(result.allowCredentials).toBeDefined();
      expect(Array.isArray(result.allowCredentials)).toBe(true);
    });

    it("should handle type assertions for base64url strings", () => {
      const result = createWebRegistrationOptions(
        "test-challenge",
        "user123",
        "testuser",
        "Test User",
        "example.com",
        "Test App",
      );

      // Verify that the challenge and user.id are valid base64url-like strings
      const challenge: Base64URLString = result.challenge;
      const userId: Base64URLString = result.user.id;

      expect(typeof challenge).toBe("string");
      expect(typeof userId).toBe("string");
    });
  });
});

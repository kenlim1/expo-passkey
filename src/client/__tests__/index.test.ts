/**
 * @file Tests for client/index.ts module exports
 */

// First mock the expo-modules-core so requireNativeModule works
jest.mock("expo-modules-core", () => ({
  requireNativeModule: jest.fn(() => ({
    isPasskeySupported: jest.fn().mockReturnValue(true),
    createPasskey: jest.fn().mockResolvedValue("mock-credential-json"),
    authenticateWithPasskey: jest
      .fn()
      .mockResolvedValue("mock-credential-json"),
  })),
}));

// Mock the native module
jest.mock("../native-module", () => ({
  isNativePasskeySupported: jest.fn().mockResolvedValue(true),
  createNativePasskey: jest.fn().mockResolvedValue({
    id: "test-credential-id",
    rawId: "test-raw-id",
    type: "public-key",
    response: {
      clientDataJSON: "test-client-data",
      attestationObject: "test-attestation",
      publicKey: "test-public-key",
      transports: ["internal"],
    },
    authenticatorAttachment: "platform",
  }),
  authenticateWithNativePasskey: jest.fn().mockResolvedValue({
    id: "test-credential-id",
    rawId: "test-raw-id",
    type: "public-key",
    response: {
      clientDataJSON: "test-client-data",
      authenticatorData: "test-auth-data",
      signature: "test-signature",
      userHandle: "test-user-handle",
    },
    authenticatorAttachment: "platform",
  }),
}));

// Mock dependencies to ensure test isolation
jest.mock("../utils/device", () => ({
  getDeviceInfo: jest.fn().mockResolvedValue({
    deviceId: "test-device-id",
    platform: "ios",
    model: "iPhone 14",
    manufacturer: "Apple",
    osVersion: "16.0",
    appVersion: "1.0.0",
    biometricSupport: {
      isSupported: true,
      isEnrolled: true,
      availableTypes: [2],
      authenticationType: "Face ID",
      error: null,
      platformDetails: {
        platform: "ios",
        version: "16.0",
      },
    },
  }),
  hasPasskeysRegistered: jest.fn().mockResolvedValue(true),
}));

// Now import the modules
import * as coreExports from "../core";
import * as indexExports from "../index";

describe("src/client/index.ts exports", () => {
  it("should re-export everything from core", () => {
    // Check that all exports from core exist in index
    // This checks the entire object for equivalence
    expect(Object.keys(indexExports)).toEqual(Object.keys(coreExports));

    // Verify critical exports are present
    expect(indexExports.expoPasskeyClient).toBeDefined();
    expect(typeof indexExports.expoPasskeyClient).toBe("function");

    // Test specific functions are the same
    expect(indexExports.expoPasskeyClient).toBe(coreExports.expoPasskeyClient);
  });

  it("returns a valid client plugin when called", () => {
    // Create a client instance
    const client = indexExports.expoPasskeyClient();

    // Verify structure of returned plugin object
    expect(client).toHaveProperty("id", "expo-passkey");
    expect(client).toHaveProperty("getActions");
    expect(client).toHaveProperty("pathMethods");
    expect(client).toHaveProperty("fetchPlugins");

    // Verify getActions is a function
    expect(typeof client.getActions).toBe("function");

    // Verify fetchPlugins is an array
    expect(Array.isArray(client.fetchPlugins)).toBe(true);
  });
});

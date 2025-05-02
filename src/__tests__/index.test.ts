/**
 * @file Tests for main module exports
 */

// First create all mocks needed to successfully load the module
// Mock expo-modules-core
jest.mock("expo-modules-core", () => ({
  requireNativeModule: jest.fn(() => ({
    isPasskeySupported: jest.fn().mockReturnValue(true),
    createPasskey: jest.fn().mockResolvedValue("mock-credential-json"),
    authenticateWithPasskey: jest
      .fn()
      .mockResolvedValue("mock-credential-json"),
  })),
  EventEmitter: class MockEventEmitter {
    constructor() {}
    addListener() {
      return { remove: () => {} };
    }
    removeAllListeners() {}
    emit() {}
  },
}));

// Mock invariant which is used by expo-modules-core
jest.mock(
  "invariant",
  () =>
    function mockInvariant(condition: any, message: string) {
      if (!condition) {
        throw new Error(message);
      }
    },
);

// Mock the native module
jest.mock("../client/native-module", () => ({
  isNativePasskeySupported: jest.fn().mockResolvedValue(true),
  createNativePasskey: jest.fn().mockResolvedValue({}),
  authenticateWithNativePasskey: jest.fn().mockResolvedValue({}),
}));

// Mock utils
jest.mock("../client/utils/device", () => ({
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
  hasUserPasskeysRegistered: jest.fn().mockResolvedValue(true),
}));

jest.mock("../client/utils/biometrics", () => ({
  checkBiometricSupport: jest.fn().mockResolvedValue({
    isSupported: true,
    isEnrolled: true,
    availableTypes: [2],
    authenticationType: "Face ID",
    error: null,
    platformDetails: {
      platform: "ios",
      version: "16.0",
    },
  }),
  getBiometricType: jest.fn().mockReturnValue("Face ID"),
  authenticateWithBiometrics: jest.fn().mockResolvedValue(true),
  isPasskeySupported: jest.fn().mockResolvedValue(true),
}));

jest.mock("../client/utils/modules", () => ({
  loadExpoModules: jest.fn().mockReturnValue({
    Platform: {
      OS: "ios",
      Version: "16.0",
      select: jest.fn((obj) => obj.ios),
    },
    SecureStore: {
      getItemAsync: jest.fn(),
      setItemAsync: jest.fn(),
      deleteItemAsync: jest.fn(),
    },
    Device: {
      platformApiLevel: undefined,
    },
    LocalAuthentication: {
      AuthenticationType: {
        FINGERPRINT: 1,
        FACIAL_RECOGNITION: 2,
        IRIS: 3,
      },
    },
  }),
}));

// Now import the modules for testing - import from the main entry point
import ExpoPasskeyModuleDefault, {
  expoPasskeyClient,
  ERROR_CODES,
  PasskeyError,
  // Types should be imported but not needed for runtime testing
} from "../index";

describe("Expo Passkey Main Module", () => {
  test("exports the correct client-side functionality", () => {
    // Check that main module exports are defined
    expect(ExpoPasskeyModuleDefault).toBeDefined();
    expect(expoPasskeyClient).toBeDefined();

    // Check that client is a function
    expect(typeof expoPasskeyClient).toBe("function");

    // Server functions should NOT be exported from the main index
    // @ts-ignore - intentionally checking that expoPasskey is not exported
    expect(global.expoPasskey).toBeUndefined();
  });

  test("expoPasskeyClient returns a plugin object", () => {
    const plugin = expoPasskeyClient();

    // Check that it returns an object with the expected structure
    expect(plugin).toHaveProperty("id", "expo-passkey");
    expect(plugin).toHaveProperty("getActions");
    expect(plugin).toHaveProperty("fetchPlugins");
    expect(plugin).toHaveProperty("pathMethods");

    // Verify that getActions returns a function
    expect(typeof plugin.getActions).toBe("function");

    // Verify that fetchPlugins is an array
    expect(Array.isArray(plugin.fetchPlugins)).toBe(true);
  });

  test("exports error codes and PasskeyError", () => {
    expect(ERROR_CODES).toBeDefined();
    expect(ERROR_CODES.WEBAUTHN).toBeDefined();
    expect(ERROR_CODES.BIOMETRIC).toBeDefined();
    expect(PasskeyError).toBeDefined();

    // Verify PasskeyError is a constructor
    const error = new PasskeyError("test-code", "Test message");
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("test-code");
    expect(error.message).toBe("Test message");
  });
});

import { ERROR_CODES } from "../../types/errors";

// Mock the environment module with consistent behavior
jest.mock("../utils/environment", () => ({
  isExpoEnvironment: jest.fn(),
  validateExpoEnvironment: jest.fn(),
  isSupportedPlatform: jest.fn(),
}));

// Import after mocking
import { isExpoEnvironment } from "../utils/environment";
import { loadExpoModules } from "../utils/modules";

describe("loadExpoModules function", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Reset mock implementation
    (isExpoEnvironment as jest.Mock).mockReset();

    // Mock modules needed by the test
    jest.mock("react-native", () => ({ Platform: { OS: "ios" } }), {
      virtual: true,
    });
    jest.mock("expo-application", () => ({}), { virtual: true });
    jest.mock("expo-device", () => ({}), { virtual: true });
    jest.mock("expo-local-authentication", () => ({}), { virtual: true });
    jest.mock("expo-secure-store", () => ({}), { virtual: true });
    jest.mock("expo-crypto", () => ({}), { virtual: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("throws error when not in Expo environment", () => {
    // Setup the mock to return false
    (isExpoEnvironment as jest.Mock).mockReturnValue(false);

    // Call and verify error
    try {
      loadExpoModules();
      fail("Should throw error");
    } catch (error) {
      // Check properties without instanceof which causes issues
      expect(error.code).toBe(ERROR_CODES.ENVIRONMENT.NOT_SUPPORTED);
      expect(error.message).toContain("Expo Passkey is only supported");
    }

    // Verify mock was called
    expect(isExpoEnvironment).toHaveBeenCalled();
  });

  test("successfully loads all modules when in Expo environment", () => {
    // Setup the mock to return true
    (isExpoEnvironment as jest.Mock).mockReturnValue(true);

    // Call and verify result
    const result = loadExpoModules();

    // Verify expected structure
    expect(result).toHaveProperty("Platform");
    expect(result).toHaveProperty("Application");
    expect(result).toHaveProperty("Device");
    expect(result).toHaveProperty("LocalAuthentication");
    expect(result).toHaveProperty("SecureStore");
    expect(result).toHaveProperty("Crypto");
  });
});

describe("loadExpoModules error handling - react-native", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock environment check to pass
    jest.mock("../utils/environment", () => ({
      isExpoEnvironment: () => true,
    }));

    // Mock react-native to throw
    jest.mock(
      "react-native",
      () => {
        throw new Error("react-native failed to load");
      },
      { virtual: true },
    );

    // Mock the rest normally
    jest.mock("expo-application", () => ({}), { virtual: true });
    jest.mock("expo-device", () => ({}), { virtual: true });
    jest.mock("expo-local-authentication", () => ({}), { virtual: true });
    jest.mock("expo-secure-store", () => ({}), { virtual: true });
    jest.mock("expo-crypto", () => ({}), { virtual: true });
  });

  test("handles module loading Error correctly", () => {
    // Import after mocking
    const { loadExpoModules } = require("../utils/modules");

    try {
      loadExpoModules();
      fail("Should throw");
    } catch (error) {
      expect(error.code).toBe(ERROR_CODES.ENVIRONMENT.MODULE_NOT_FOUND);
      expect(error.message).toContain("react-native failed to load");
    }
  });
});

describe("loadExpoModules error handling - non-Error", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock environment check to pass
    jest.mock("../utils/environment", () => ({
      isExpoEnvironment: () => true,
    }));

    // Mock expo-device to throw a non-Error value
    jest.mock("react-native", () => ({ Platform: {} }), { virtual: true });
    jest.mock("expo-application", () => ({}), { virtual: true });
    jest.mock(
      "expo-device",
      () => {
        // eslint-disable-next-line no-throw-literal
        throw "Not an Error object";
      },
      { virtual: true },
    );
    jest.mock("expo-local-authentication", () => ({}), { virtual: true });
    jest.mock("expo-secure-store", () => ({}), { virtual: true });
    jest.mock("expo-crypto", () => ({}), { virtual: true });
  });

  test("handles non-Error exceptions properly", () => {
    // Import after mocking
    const { loadExpoModules } = require("../utils/modules");

    try {
      loadExpoModules();
      fail("Should throw");
    } catch (error) {
      expect(error.code).toBe(ERROR_CODES.ENVIRONMENT.MODULE_NOT_FOUND);
      expect(error.message).toContain("Unknown error");
    }
  });
});

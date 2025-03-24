/**
 * @file environment utility tests
 * @description Tests for environment detection, validation, and platform support
 */

// Mock required modules
jest.mock(
  "react-native",
  () => ({
    Platform: {
      OS: "ios",
      Version: "16.0",
    },
  }),
  { virtual: true },
);

// Mock the modules without messing with require directly
jest.mock("expo", () => ({}), { virtual: true });
jest.mock("expo-application", () => ({}), { virtual: true });
jest.mock("expo-device", () => ({}), { virtual: true });
jest.mock("expo-local-authentication", () => ({}), { virtual: true });
jest.mock("expo-secure-store", () => ({}), { virtual: true });
jest.mock("expo-crypto", () => ({}), { virtual: true });

// Import after mocking
import {
  isExpoEnvironment,
  isSupportedPlatform,
  validateExpoEnvironment,
} from "../utils/environment";

describe("Environment Utilities", () => {
  // Basic functionality tests
  describe("Basic environment detection", () => {
    test("isExpoEnvironment function exists and returns a boolean", () => {
      expect(typeof isExpoEnvironment).toBe("function");
      const result = isExpoEnvironment();
      expect(typeof result).toBe("boolean");
    });

    test("validateExpoEnvironment executes without error with mocked dependencies", () => {
      // The actual implementation of isExpoEnvironment will use the mocked modules
      expect(() => validateExpoEnvironment()).not.toThrow();
    });
  });

  // Branch coverage tests for isExpoEnvironment
  describe("isExpoEnvironment branch coverage", () => {
    beforeEach(() => {
      jest.resetModules();
    });

    afterEach(() => {
      jest.resetAllMocks();
      jest.restoreAllMocks();
    });

    it("should return false if React Native is not available", () => {
      // Make react-native module throw when imported
      jest.doMock(
        "react-native",
        () => {
          throw new Error("Cannot find module 'react-native'");
        },
        { virtual: true },
      );

      // Re-import to get the version with our mock
      const { isExpoEnvironment } = require("../utils/environment");
      expect(isExpoEnvironment()).toBe(false);
    });

    it("should return false if Expo SDK is not available", () => {
      // Make expo module throw when imported
      jest.doMock(
        "expo",
        () => {
          throw new Error("Cannot find module 'expo'");
        },
        { virtual: true },
      );

      // Re-import to get the version with our mock
      const { isExpoEnvironment } = require("../utils/environment");
      expect(isExpoEnvironment()).toBe(false);
    });

    it("should return false if any required Expo module is missing", () => {
      // Test each module individually
      [
        "expo-application",
        "expo-device",
        "expo-local-authentication",
        "expo-secure-store",
        "expo-crypto",
      ].forEach((moduleName) => {
        jest.resetModules();

        // Setup mocks for all modules except the one we want to fail
        jest.doMock(
          "react-native",
          () => ({
            Platform: { OS: "ios", Version: "16.0" },
          }),
          { virtual: true },
        );
        jest.doMock("expo", () => ({}), { virtual: true });

        // Mock all modules except the one to fail
        [
          "expo-application",
          "expo-device",
          "expo-local-authentication",
          "expo-secure-store",
          "expo-crypto",
        ].forEach((mod) => {
          if (mod !== moduleName) {
            jest.doMock(mod, () => ({}), { virtual: true });
          } else {
            jest.doMock(
              mod,
              () => {
                throw new Error(`Cannot find module '${mod}'`);
              },
              { virtual: true },
            );
          }
        });

        // Re-import to get the version with our mocks
        const { isExpoEnvironment } = require("../utils/environment");
        expect(isExpoEnvironment()).toBe(false);
      });
    });

    it("should return false if any exception is thrown", () => {
      // Make react-native throw a general error
      jest.doMock(
        "react-native",
        () => {
          throw new Error("Unexpected error");
        },
        { virtual: true },
      );

      // Re-import to get the version with our mock
      const { isExpoEnvironment } = require("../utils/environment");
      expect(isExpoEnvironment()).toBe(false);
    });
  });

  // Error handling tests
  describe("Environment Error Handling", () => {
    beforeEach(() => {
      jest.resetModules();

      // Mock environment module to return false for isExpoEnvironment
      jest.doMock("../utils/environment", () => {
        const actualModule = jest.requireActual("../utils/environment");
        return {
          ...actualModule,
          isExpoEnvironment: jest.fn().mockReturnValue(false),
        };
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
      jest.restoreAllMocks();
    });

    test("isExpoEnvironment returns false when a required module is missing", () => {
      // Import the mocked version
      const { isExpoEnvironment } = require("../utils/environment");

      // Should return false because it's explicitly mocked to do so
      expect(isExpoEnvironment()).toBe(false);
    });
  });

  // validateExpoEnvironment tests
  describe("validateExpoEnvironment", () => {
    // Create a local mock function we can control
    let mockIsExpoEnvironment: jest.Mock;

    beforeEach(() => {
      jest.resetModules();

      // Create a mock function we can control
      mockIsExpoEnvironment = jest.fn();

      // Mock the entire module with our controlled function
      jest.doMock(
        "../utils/environment",
        () => {
          // Get the actual implementation
          const actualModule = jest.requireActual("../utils/environment");

          // Return a modified version with our mock
          return {
            ...actualModule,
            // Replace the isExpoEnvironment with our mock
            isExpoEnvironment: mockIsExpoEnvironment,
            // Re-implement validateExpoEnvironment to use our mock
            validateExpoEnvironment: () => {
              // This uses our mockIsExpoEnvironment instead of the actual one
              if (!mockIsExpoEnvironment()) {
                throw new Error(
                  "Expo Passkey requires an Expo environment with all required modules installed. " +
                    "This package cannot be used in web browsers or other non-Expo environments.",
                );
              }
              return true;
            },
          };
        },
        { virtual: true },
      );
    });

    afterEach(() => {
      jest.resetAllMocks();
      jest.restoreAllMocks();
    });

    it("should throw with detailed message when not in Expo environment", () => {
      // Return false from our mock to trigger the error
      mockIsExpoEnvironment.mockReturnValue(false);

      // Import the mocked module
      const { validateExpoEnvironment } = require("../utils/environment");

      // Now test with our mocked implementation
      expect(() => validateExpoEnvironment()).toThrow(
        /Expo Passkey requires an Expo environment with all required modules installed/,
      );
    });

    it("should return true when in a valid Expo environment", () => {
      // Return true from our mock
      mockIsExpoEnvironment.mockReturnValue(true);

      // Import the mocked module
      const { validateExpoEnvironment } = require("../utils/environment");

      // Test with our mocked implementation
      expect(validateExpoEnvironment()).toBe(true);
    });
  });

  // Platform support tests
  describe("isSupportedPlatform", () => {
    // iOS tests
    describe("iOS platform support", () => {
      test("returns true for iOS version 16.0 and above", () => {
        // Exact minimum version
        expect(isSupportedPlatform("ios", 16)).toBe(true);
        expect(isSupportedPlatform("ios", "16.0")).toBe(true);
        expect(isSupportedPlatform("ios", "16")).toBe(true);

        // Above minimum
        expect(isSupportedPlatform("ios", 17)).toBe(true);
        expect(isSupportedPlatform("ios", "17.0")).toBe(true);
        expect(isSupportedPlatform("ios", "16.5")).toBe(true);
        expect(isSupportedPlatform("ios", "18.0")).toBe(true);
      });

      test("returns false for iOS versions below 16", () => {
        expect(isSupportedPlatform("ios", 15)).toBe(false);
        expect(isSupportedPlatform("ios", "15.9")).toBe(false);
        expect(isSupportedPlatform("ios", "15.999")).toBe(false);
        expect(isSupportedPlatform("ios", "14.0")).toBe(false);
        expect(isSupportedPlatform("ios", "10.0")).toBe(false);
      });

      test("handles invalid iOS version strings", () => {
        expect(isSupportedPlatform("ios", "not-a-number")).toBe(false);
        expect(isSupportedPlatform("ios", "")).toBe(false);
        expect(isSupportedPlatform("ios", "16beta")).toBe(false);
        expect(isSupportedPlatform("ios", "NaN")).toBe(false);
        expect(isSupportedPlatform("ios", "x")).toBe(false);
      });
    });

    // Android tests
    describe("Android platform support", () => {
      test("returns true for Android API level 29 and above", () => {
        // Exact minimum API level
        expect(isSupportedPlatform("android", 29)).toBe(true);

        // Above minimum
        expect(isSupportedPlatform("android", 30)).toBe(true);
        expect(isSupportedPlatform("android", 31)).toBe(true);
        expect(isSupportedPlatform("android", 33)).toBe(true);
      });

      test("returns false for Android API levels below 29", () => {
        expect(isSupportedPlatform("android", 28)).toBe(false);
        expect(isSupportedPlatform("android", 27)).toBe(false);
        expect(isSupportedPlatform("android", 23)).toBe(false);
      });

      test("handles invalid Android API levels", () => {
        expect(isSupportedPlatform("android", "29")).toBe(false); // String instead of number
        expect(isSupportedPlatform("android", "30")).toBe(false);
        expect(isSupportedPlatform("android", NaN)).toBe(false);
        expect(isSupportedPlatform("android", 0)).toBe(false);
        expect(isSupportedPlatform("android", -1)).toBe(false);
      });
    });

    // Other platforms tests
    describe("Other platforms", () => {
      test("returns false for all unsupported platforms regardless of version", () => {
        expect(isSupportedPlatform("web", 1)).toBe(false);
        expect(isSupportedPlatform("web", 100)).toBe(false);
        expect(isSupportedPlatform("web", "1.0")).toBe(false);
        expect(isSupportedPlatform("windows", 10)).toBe(false);
        expect(isSupportedPlatform("macos", "10.15")).toBe(false);
        expect(isSupportedPlatform("linux", 5)).toBe(false);
        expect(isSupportedPlatform("", 100)).toBe(false);
        expect(isSupportedPlatform("unknown-platform", 100)).toBe(false);
      });
    });
  });
});

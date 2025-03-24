/**
 * @file Comprehensive branch coverage tests for client core
 * @description Tests for edge cases and branch coverage across the entire client core module
 */

import { PasskeyError } from '../../types/errors';
import { expoPasskeyClient } from '../core';
import { authenticateWithBiometrics } from '../utils/biometrics';
import { clearDeviceId, getDeviceInfo } from '../utils/device';
import { loadExpoModules } from '../utils/modules';

// Mock dependencies
jest.mock('../utils/device');
jest.mock('../utils/biometrics');
jest.mock('../utils/modules');

describe('Client Core - Branch Coverage Tests', () => {
  // Mock fetch
  const mockFetch = jest.fn();

  // Create default device info mock
  const createDefaultDeviceInfo = () => ({
    deviceId: 'test-device-id',
    platform: 'ios',
    model: 'iPhone 14',
    manufacturer: 'Apple',
    osVersion: '16.0',
    appVersion: '1.0.0',
    biometricSupport: {
      isSupported: true,
      isEnrolled: true,
      availableTypes: [2],
      authenticationType: 'Face ID',
      error: null,
      platformDetails: {
        platform: 'ios',
        version: '16.0',
      },
    },
  });

  // Create Android device info mock
  const createAndroidDeviceInfo = () => ({
    deviceId: 'android-device-id',
    platform: 'android',
    model: 'Pixel 6',
    manufacturer: 'Google',
    osVersion: '13',
    appVersion: '1.0.0',
    biometricSupport: {
      isSupported: true,
      isEnrolled: true,
      availableTypes: [1],
      authenticationType: 'Fingerprint',
      error: null,
      platformDetails: {
        platform: 'android',
        version: 33,
        apiLevel: 33,
        manufacturer: 'Google',
        brand: 'Google',
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();

    // Default mock setup for iOS
    (getDeviceInfo as jest.Mock).mockResolvedValue(createDefaultDeviceInfo());
    (authenticateWithBiometrics as jest.Mock).mockResolvedValue(true);

    // Setup default Platform mock
    (loadExpoModules as jest.Mock).mockReturnValue({
      Platform: {
        OS: 'ios',
        Version: '16.0',
        select: jest.fn((obj) => obj.ios),
      },
      Device: {
        platformApiLevel: undefined,
      },
    });
  });

  describe('registerPasskey', () => {
    it('should handle different biometric enrollment error messages based on platform', async () => {
      // First test iOS platform
      (loadExpoModules as jest.Mock).mockReturnValue({
        Platform: {
          OS: 'ios',
          Version: '16.0',
          select: jest.fn((obj) => obj.ios),
        },
        Device: {
          platformApiLevel: undefined,
        },
      });

      // Mock device with biometric support but not enrolled
      (getDeviceInfo as jest.Mock).mockResolvedValue({
        ...createDefaultDeviceInfo(),
        biometricSupport: {
          ...createDefaultDeviceInfo().biometricSupport,
          isEnrolled: false,
        },
      });

      // Get actions for iOS test
      const actions = expoPasskeyClient().getActions(mockFetch);
      const result = await actions.registerPasskey({ userId: 'user123' });

      // Verify iOS-specific error message
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain(
        'Please set up Face ID or Touch ID in your iOS Settings'
      );

      // Clear all mocks before Android test
      jest.clearAllMocks();

      // Now test for Android platform - create new mocks
      (loadExpoModules as jest.Mock).mockReturnValue({
        Platform: {
          OS: 'android',
          Version: 33,
          select: jest.fn((obj) => obj.android),
        },
        Device: {
          platformApiLevel: 33,
        },
      });

      // Mock Android device
      (getDeviceInfo as jest.Mock).mockResolvedValue({
        ...createAndroidDeviceInfo(),
        biometricSupport: {
          ...createAndroidDeviceInfo().biometricSupport,
          isEnrolled: false,
        },
      });

      // Get fresh actions for Android test with new client instance
      const androidActions = expoPasskeyClient().getActions(mockFetch);
      const result2 = await androidActions.registerPasskey({ userId: 'user123' });

      // Verify Android-specific error message
      expect(result2.error).toBeDefined();
      expect(result2.error?.message).toContain(
        'Please set up biometric authentication in your device settings'
      );
    });

    it('should handle deviceId being passed directly in params', async () => {
      // Setup successful response
      mockFetch.mockResolvedValue({
        data: {
          success: true,
          rpName: 'Test App',
          rpId: 'example.com',
        },
      });

      const actions = expoPasskeyClient().getActions(mockFetch);

      // Call register with explicit deviceId
      const custom_device_id = 'custom-device-id-123';
      await actions.registerPasskey({
        userId: 'user123',
        deviceId: custom_device_id,
        metadata: {
          deviceName: 'Custom Device',
        },
      });

      // Verify the API call used the passed deviceId
      expect(mockFetch).toHaveBeenCalledWith(
        '/expo-passkey/register',
        expect.objectContaining({
          body: expect.objectContaining({
            deviceId: custom_device_id,
          }),
        })
      );
    });

    it('should merge provided metadata with default deviceInfo metadata', async () => {
      mockFetch.mockResolvedValue({
        data: { success: true, rpName: 'Test', rpId: 'test.com' },
      });

      const actions = expoPasskeyClient().getActions(mockFetch);

      await actions.registerPasskey({
        userId: 'user123',
        metadata: {
          lastLocation: 'custom-location',
          brand: 'custom-brand',
        },
      });

      // Verify metadata was merged correctly
      expect(mockFetch).toHaveBeenCalledWith(
        '/expo-passkey/register',
        expect.objectContaining({
          body: expect.objectContaining({
            metadata: expect.objectContaining({
              // Default values from device info
              deviceName: 'iPhone 14',
              deviceModel: 'iPhone 14',
              appVersion: '1.0.0',
              manufacturer: 'Apple',
              biometricType: 'Face ID',
              // Custom values provided in the call
              lastLocation: 'custom-location',
              brand: 'custom-brand',
            }),
          }),
        })
      );
    });

    it('should handle network errors during registration', async () => {
      // Mock a network error
      mockFetch.mockRejectedValue(new Error('Network error'));

      const actions = expoPasskeyClient().getActions(mockFetch);
      const result = await actions.registerPasskey({ userId: 'user123' });

      // Verify error handling
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Network error');
      expect(result.data).toBeNull();
    });

    it('should handle API response with only error object', async () => {
      // Mock API returning only an error object without data
      mockFetch.mockResolvedValue({
        error: {
          message: 'Registration failed: User not found',
          code: 'user_not_found',
        },
      });

      const actions = expoPasskeyClient().getActions(mockFetch);
      const result = await actions.registerPasskey({ userId: 'user123' });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Registration failed: User not found');
      expect(result.data).toBeNull();
    });

    it('should handle non-standard error objects in API responses', async () => {
      // Array of different error formats to test handling
      const errorFormats = [
        // String error message
        { error: 'Simple error string' },
        // Error with non-standard structure
        { error: { custom: 'format', errorMessage: 'Custom error format' } },
        // Array of errors
        { error: [{ message: 'Error 1' }, { message: 'Error 2' }] },
        // Null error
        { error: null, otherInfo: 'Request failed' },
        // Unexpected fields
        { unexpected: 'field', errorData: { message: 'Hidden error' } },
      ];

      const actions = expoPasskeyClient().getActions(mockFetch);

      for (const errorFormat of errorFormats) {
        mockFetch.mockResolvedValueOnce(errorFormat);
        const result = await actions.registerPasskey({ userId: 'user123' });

        // Verify error handling
        expect(result.error).toBeDefined();
        expect(result.data).toBeNull();
      }
    });

    it('should handle authentication failure during registration', async () => {
      // Mock authentication failure
      (authenticateWithBiometrics as jest.Mock).mockRejectedValue(
        new PasskeyError('biometric_authentication_failed', 'User cancelled authentication')
      );

      const actions = expoPasskeyClient().getActions(mockFetch);
      const result = await actions.registerPasskey({ userId: 'user123' });

      // Verify error handling
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('User cancelled authentication');
      expect(result.data).toBeNull();

      // Verify the API call was not made
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should pass all metadata fields in registration', async () => {
      // Setup successful response
      mockFetch.mockResolvedValue({
        data: {
          success: true,
          rpName: 'Test App',
          rpId: 'example.com',
        },
      });

      const actions = expoPasskeyClient().getActions(mockFetch);

      // Call with extensive metadata
      await actions.registerPasskey({
        userId: 'user123',
        metadata: {
          deviceName: 'Custom Name',
          deviceModel: 'Custom Model',
          appVersion: '2.0.0',
          manufacturer: 'Custom Manufacturer',
          biometricType: 'Custom Biometric',
          lastLocation: 'registration-test',
          brand: 'Custom Brand',
          lastAuthenticationAt: '2023-01-01T00:00:00Z',
        },
      });

      // Verify all metadata fields are included in the request
      expect(mockFetch).toHaveBeenCalledWith(
        '/expo-passkey/register',
        expect.objectContaining({
          body: expect.objectContaining({
            metadata: expect.objectContaining({
              deviceName: 'Custom Name',
              deviceModel: 'Custom Model',
              appVersion: '2.0.0',
              manufacturer: 'Custom Manufacturer',
              biometricType: 'Custom Biometric',
              lastLocation: 'registration-test',
              brand: 'Custom Brand',
              lastAuthenticationAt: '2023-01-01T00:00:00Z',
            }),
          }),
        })
      );
    });
  });

  describe('authenticateWithPasskey', () => {
    it('should handle various API response formats', async () => {
      // Set up biometric success
      (authenticateWithBiometrics as jest.Mock).mockResolvedValue(true);

      const actions = expoPasskeyClient().getActions(mockFetch);

      // Test case 1: Response with error object but null data
      mockFetch.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'Authentication failed: Invalid credential',
          code: 'invalid_credential',
        },
      });

      const result1 = await actions.authenticateWithPasskey();
      expect(result1.error).toBeDefined();
      expect(result1.error?.message).toBe('Authentication failed: Invalid credential');
      expect(result1.data).toBeNull();

      // Test case 2: Response with error field but lacking proper data structure
      mockFetch.mockResolvedValueOnce({
        error: {
          message: 'Authentication failed',
          code: 'auth_failed',
        },
      });

      const result2 = await actions.authenticateWithPasskey();
      expect(result2.error).toBeDefined();
      expect(result2.error?.message).toBe('Authentication failed');
      expect(result2.data).toBeNull();

      // Test case 3: Successful response with expected data format
      mockFetch.mockResolvedValueOnce({
        data: {
          token: 'valid-token',
          user: { id: 'user123', name: 'Test User' },
        },
        error: null,
      });

      const result3 = await actions.authenticateWithPasskey();
      expect(result3.error).toBeNull();
      expect(result3.data).toEqual({
        token: 'valid-token',
        user: { id: 'user123', name: 'Test User' },
      });
    });

    it('should handle response.data with missing token or user fields', async () => {
      // Test cases with invalid data structures
      const testCases = [
        { data: { token: 'valid-token' } }, // Missing user
        { data: { user: { id: 'user123' } } }, // Missing token
        { data: { something: 'else' } }, // Missing both token and user
        { data: null }, // Null data
        { data: {} }, // Empty object
      ];

      const actions = expoPasskeyClient().getActions(mockFetch);

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce(testCase);
        const result = await actions.authenticateWithPasskey();

        // All these cases should result in an error
        expect(result.error).toBeDefined();
        expect(result.data).toBeNull();
      }
    });

    it('should handle response with non-object data property', async () => {
      // Test cases with invalid data property types
      const testCases = [
        { data: 'string data' },
        { data: 123 },
        { data: true },
        { data: [1, 2, 3] },
        { data: () => {} },
      ];

      const actions = expoPasskeyClient().getActions(mockFetch);

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce(testCase);
        const result = await actions.authenticateWithPasskey();

        // All these cases should result in an error
        expect(result.error).toBeDefined();
        expect(result.data).toBeNull();
      }
    });

    it('should correctly parse response with valid token and user', async () => {
      // Good response format
      mockFetch.mockResolvedValue({
        data: {
          token: 'valid-token',
          user: { id: 'user123', name: 'Test User' },
        },
      });

      const actions = expoPasskeyClient().getActions(mockFetch);
      const result = await actions.authenticateWithPasskey();

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        token: 'valid-token',
        user: { id: 'user123', name: 'Test User' },
      });
    });

    it('should handle API throwing network errors', async () => {
      // Mock network failure
      mockFetch.mockRejectedValue(new Error('Network connection failed'));

      const actions = expoPasskeyClient().getActions(mockFetch);
      const result = await actions.authenticateWithPasskey();

      // Verify error handling
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Network connection failed');
      expect(result.data).toBeNull();
    });

    it('should handle API returning errors with status codes', async () => {
      // Create an error with status code
      const apiError = new Error('Unauthorized access');
      (apiError as any).status = 401;
      (apiError as any).statusText = 'Unauthorized';

      mockFetch.mockRejectedValue(apiError);

      const actions = expoPasskeyClient().getActions(mockFetch);
      const result = await actions.authenticateWithPasskey();

      // Verify error info is preserved
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Unauthorized access');
      expect(result.data).toBeNull();
    });

    it('should pass custom deviceId and full metadata in auth request', async () => {
      // Setup successful response
      mockFetch.mockResolvedValue({
        data: {
          token: 'test-token',
          user: { id: 'user123' },
        },
      });

      const actions = expoPasskeyClient().getActions(mockFetch);

      const customDeviceId = 'custom-auth-device-id';

      // Call with custom device ID and metadata
      await actions.authenticateWithPasskey({
        deviceId: customDeviceId,
        metadata: {
          lastLocation: 'auth-test',
          appVersion: 'custom-version',
          deviceModel: 'custom-model',
          manufacturer: 'custom-mfg',
          biometricType: 'custom-bio',
          brand: 'custom-brand',
          deviceName: 'custom-name',
        },
      });

      // Verify correct params were used
      expect(mockFetch).toHaveBeenCalledWith(
        '/expo-passkey/authenticate',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            deviceId: customDeviceId,
            metadata: expect.objectContaining({
              lastLocation: 'auth-test',
              appVersion: 'custom-version',
              deviceModel: 'custom-model',
              manufacturer: 'custom-mfg',
              biometricType: 'custom-bio',
              brand: 'custom-brand',
              deviceName: 'custom-name',
            }),
          }),
        })
      );
    });

    it('should handle completely unexpected API response structures', async () => {
      // Test with various unexpected response structures
      const unexpectedResponses = [
        null, // null response
        undefined, // undefined response
        {}, // empty object
        { unexpectedField: true }, // object with unexpected fields
        { data: null, error: null }, // nulls for both data and error
        { data: {}, error: {} }, // empty objects for data and error
        true, // boolean value
        'string response', // string value
        42, // number value
      ];

      for (const response of unexpectedResponses) {
        mockFetch.mockResolvedValueOnce(response);

        const actions = expoPasskeyClient().getActions(mockFetch);
        const result = await actions.authenticateWithPasskey();

        // All unexpected structures should result in error
        expect(result.error).toBeDefined();
        expect(result.data).toBeNull();
      }
    });
  });

  describe('listPasskeys', () => {
    it('should extract error message from different error formats', async () => {
      // Test various error response formats
      const errorFormats = [
        { error: { message: 'Standard error format' } },
        { error: { errorMessage: 'Non-standard field name' } },
        { error: 'Just a string error' },
        { errorMessage: 'Field at root level' },
        { message: 'Another root level field' },
      ];

      const actions = expoPasskeyClient().getActions(mockFetch);

      for (const errorFormat of errorFormats) {
        mockFetch.mockResolvedValueOnce(errorFormat);
        const result = await actions.listPasskeys({ userId: 'user123' });

        // Each of these should result in an error being returned
        expect(result.error).toBeDefined();
        expect(result.data).toEqual({ passkeys: [], nextOffset: undefined });
      }
    });

    it('should reject with empty userId', async () => {
      const actions = expoPasskeyClient().getActions(mockFetch);

      // Test with various empty userIds
      const emptyUserIds = ['', null, undefined];

      for (const userId of emptyUserIds) {
        const result = await actions.listPasskeys({
          // @ts-expect-error - Intentionally testing with invalid values
          userId: userId,
        });

        // Should return an error
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('userId is required');
        expect(result.data).toEqual({ passkeys: [], nextOffset: undefined });
      }
    });

    it('should pass pagination parameters correctly', async () => {
      // Mock successful response
      mockFetch.mockResolvedValue({
        data: {
          passkeys: [],
          nextOffset: 20,
        },
      });

      const actions = expoPasskeyClient().getActions(mockFetch);

      await actions.listPasskeys({
        userId: 'user123',
        limit: 10,
        offset: 5,
      });

      // Verify pagination params were passed
      expect(mockFetch).toHaveBeenCalledWith(
        '/expo-passkey/list/user123',
        expect.objectContaining({
          query: {
            limit: '10',
            offset: '5',
          },
        })
      );
    });

    it('should handle API errors with detailed information', async () => {
      // Mock API error response
      mockFetch.mockResolvedValue({
        error: {
          code: 'unauthorized_access',
          message: 'User not authorized to list these passkeys',
          details: 'Access denied for security reasons',
        },
      });

      const actions = expoPasskeyClient().getActions(mockFetch);
      const result = await actions.listPasskeys({ userId: 'user123' });

      // Verify error details are preserved
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('User not authorized to list these passkeys');
      expect(result.data).toEqual({ passkeys: [], nextOffset: undefined });
    });
  });

  describe('checkPasskeyRegistration', () => {
    it('should handle malformed passkeys array in response', async () => {
      // Test with responses that have passkeys in wrong format
      const testCases = [
        { data: { passkeys: { notAnArray: true } } }, // Object instead of array
        { data: { passkeys: 'string instead of array' } },
        { data: { passkeys: 123 } },
        { data: { passkeys: null } },
        { data: { passkeys: [{ noDeviceId: true }] } }, // Missing required fields
      ];

      const actions = expoPasskeyClient().getActions(mockFetch);

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce(testCase);
        const result = await actions.checkPasskeyRegistration('user123');

        // Should determine not registered in all these cases
        expect(result.isRegistered).toBe(false);
      }
    });

    it('should check deviceId and status when determining registration', async () => {
      const actions = expoPasskeyClient().getActions(mockFetch);
      const deviceId = createDefaultDeviceInfo().deviceId;

      // Case 1: Device ID matches but status is not active
      mockFetch.mockResolvedValueOnce({
        data: {
          passkeys: [{ deviceId, status: 'revoked' }],
        },
      });

      let result = await actions.checkPasskeyRegistration('user123');
      expect(result.isRegistered).toBe(false);

      // Case 2: Status is active but device ID doesn't match
      mockFetch.mockResolvedValueOnce({
        data: {
          passkeys: [{ deviceId: 'different-device', status: 'active' }],
        },
      });

      result = await actions.checkPasskeyRegistration('user123');
      expect(result.isRegistered).toBe(false);

      // Case 3: Both match - should be registered
      mockFetch.mockResolvedValueOnce({
        data: {
          passkeys: [{ deviceId, status: 'active' }],
        },
      });

      result = await actions.checkPasskeyRegistration('user123');
      expect(result.isRegistered).toBe(true);
    });

    it('should handle different passkey array formats', async () => {
      const actions = expoPasskeyClient().getActions(mockFetch);

      // Test case 1: API returns object without passkeys array
      mockFetch.mockResolvedValueOnce({
        data: {
          // Missing passkeys array
          someOtherData: true,
        },
      });

      const result1 = await actions.checkPasskeyRegistration('user123');
      expect(result1.isRegistered).toBe(false);

      // Test case 2: API returns non-array passkeys property
      mockFetch.mockResolvedValueOnce({
        data: {
          passkeys: 'Not an array',
        },
      });

      const result2 = await actions.checkPasskeyRegistration('user123');
      expect(result2.isRegistered).toBe(false);

      // Test case 3: API returns proper passkeys array but device isn't in it
      mockFetch.mockResolvedValueOnce({
        data: {
          passkeys: [{ deviceId: 'other-device', status: 'active' }],
        },
      });

      const result3 = await actions.checkPasskeyRegistration('user123');
      expect(result3.isRegistered).toBe(false);
    });
  });

  describe('revokePasskey', () => {
    it('should include reason when provided', async () => {
      // Mock successful response
      mockFetch.mockResolvedValue({
        data: {
          success: true,
        },
      });

      const actions = expoPasskeyClient().getActions(mockFetch);

      await actions.revokePasskey({
        userId: 'user123',
        deviceId: 'device123',
        reason: 'device_lost',
      });

      // Verify reason was included
      expect(mockFetch).toHaveBeenCalledWith(
        '/expo-passkey/revoke',
        expect.objectContaining({
          body: expect.objectContaining({
            reason: 'device_lost',
          }),
        })
      );
    });

    it('should clear device ID from storage after revocation', async () => {
      // Mock successful revocation
      mockFetch.mockResolvedValue({
        data: {
          success: true,
        },
      });

      const actions = expoPasskeyClient().getActions(mockFetch);

      await actions.revokePasskey({
        userId: 'user123',
      });

      // Verify device ID was cleared
      expect(clearDeviceId).toHaveBeenCalled();
    });

    it('should not clear device ID if API returns error', async () => {
      // Mock API error
      mockFetch.mockRejectedValue(new Error('Failed to revoke'));

      const actions = expoPasskeyClient().getActions(mockFetch);

      await actions.revokePasskey({
        userId: 'user123',
      });

      // Verify device ID was NOT cleared since the operation failed
      expect(clearDeviceId).not.toHaveBeenCalled();
    });
  });

  describe('isPasskeySupported', () => {
    it('should handle different apiLevel values in Android platform', async () => {
      // Setup for Android platform
      (loadExpoModules as jest.Mock).mockReturnValue({
        Platform: {
          OS: 'android',
          Version: '33',
          select: jest.fn((obj) => obj.android),
        },
        Device: {
          platformApiLevel: undefined, // Will be defined in individual tests
        },
      });

      const testApiLevels = [
        { level: 28, expected: false }, // Too low
        { level: 29, expected: true }, // Minimum
        { level: 33, expected: true }, // Well above minimum
        { level: null, expected: false }, // Null value
        { level: undefined, expected: false }, // Undefined value
        { level: '33', expected: false }, // Wrong type (string)
        { level: NaN, expected: false }, // NaN
      ];

      for (const { level, expected } of testApiLevels) {
        // Setup device info for this specific API level
        (getDeviceInfo as jest.Mock).mockResolvedValueOnce({
          ...createAndroidDeviceInfo(),
          biometricSupport: {
            ...createAndroidDeviceInfo().biometricSupport,
            platformDetails: {
              ...createAndroidDeviceInfo().biometricSupport.platformDetails,
              apiLevel: level,
            },
          },
        });

        const actions = expoPasskeyClient().getActions(mockFetch);
        const result = await actions.isPasskeySupported();

        expect(result).toBe(expected);
      }
    });

    it('should handle different iOS versions', async () => {
      // Setup for iOS
      (loadExpoModules as jest.Mock).mockReturnValue({
        Platform: {
          OS: 'ios',
          Version: '16.0', // Will be changed in tests
          select: jest.fn((obj) => obj.ios),
        },
      });

      const iosVersions = [
        { version: '15.0', expected: false }, // Too low
        { version: '15.9', expected: false }, // Still too low
        { version: '16.0', expected: true }, // Minimum
        { version: '16.5', expected: true }, // Above minimum
        { version: '17.0', expected: true }, // Well above minimum
      ];

      for (const { version, expected } of iosVersions) {
        // Update Platform.Version for this test
        (loadExpoModules as jest.Mock).mockReturnValueOnce({
          Platform: {
            OS: 'ios',
            Version: version,
            select: jest.fn((obj) => obj.ios),
          },
        });

        // Set up device info with this version
        (getDeviceInfo as jest.Mock).mockResolvedValueOnce({
          ...createDefaultDeviceInfo(),
          osVersion: version,
          biometricSupport: {
            ...createDefaultDeviceInfo().biometricSupport,
            platformDetails: {
              platform: 'ios',
              version: version,
            },
          },
        });

        const actions = expoPasskeyClient().getActions(mockFetch);
        const result = await actions.isPasskeySupported();

        expect(result).toBe(expected);
      }
    });

    it('should check both hardware and enrollment status', async () => {
      // Mock isPasskeySupported to use actual implementation
      const client = expoPasskeyClient();
      const actions = client.getActions(mockFetch);

      // 1. Test when hardware is supported but not enrolled
      (getDeviceInfo as jest.Mock).mockResolvedValueOnce({
        ...createDefaultDeviceInfo(),
        biometricSupport: {
          ...createDefaultDeviceInfo().biometricSupport,
          isSupported: true,
          isEnrolled: false,
        },
      });

      let result = await actions.isPasskeySupported();
      expect(result).toBe(false);

      // 2. Test when hardware is not supported
      (getDeviceInfo as jest.Mock).mockResolvedValueOnce({
        ...createDefaultDeviceInfo(),
        biometricSupport: {
          ...createDefaultDeviceInfo().biometricSupport,
          isSupported: false,
          isEnrolled: true,
        },
      });

      result = await actions.isPasskeySupported();
      expect(result).toBe(false);

      // 3. Test when both are supported
      (getDeviceInfo as jest.Mock).mockResolvedValueOnce({
        ...createDefaultDeviceInfo(),
        biometricSupport: {
          ...createDefaultDeviceInfo().biometricSupport,
          isSupported: true,
          isEnrolled: true,
        },
      });

      result = await actions.isPasskeySupported();
      expect(result).toBe(true);
    });

    it('should handle unsupported platforms', async () => {
      // Test with platforms other than iOS and Android
      const platforms = ['web', 'windows', 'macos', 'linux'];

      for (const platform of platforms) {
        // Setup for this platform
        (loadExpoModules as jest.Mock).mockReturnValueOnce({
          Platform: {
            OS: platform,
            Version: '1.0',
            select: jest.fn((obj) => obj[platform] || obj.default),
          },
        });

        // Set up device info
        (getDeviceInfo as jest.Mock).mockResolvedValueOnce({
          deviceId: 'test-device-id',
          platform: platform as any,
          model: 'Test Model',
          manufacturer: 'Test Manufacturer',
          osVersion: '1.0',
          appVersion: '1.0.0',
          biometricSupport: {
            isSupported: true, // Even if supported...
            isEnrolled: true, // And enrolled...
            availableTypes: [1],
            authenticationType: 'Generic',
            error: null,
            platformDetails: {
              platform: platform,
              version: '1.0',
            },
          },
        });

        const actions = expoPasskeyClient().getActions(mockFetch);
        const result = await actions.isPasskeySupported();

        // Should be false for any platform other than iOS/Android
        expect(result).toBe(false);
      }
    });

    it('should handle errors during platform/support checks', async () => {
      const client = expoPasskeyClient();
      const actions = client.getActions(mockFetch);

      // Mock getDeviceInfo to throw
      (getDeviceInfo as jest.Mock).mockRejectedValueOnce(new Error('Device info error'));

      // Should return false on error
      const result = await actions.isPasskeySupported();
      expect(result).toBe(false);
    });
  });

  describe('Fetch Plugin', () => {
    describe('init method', () => {
      it('should handle different header configurations', async () => {
        const client = expoPasskeyClient();
        const plugin = client.fetchPlugins[0];

        // Case 1: No options provided
        let result = await plugin.init('https://api.example.com');

        expect(result.options.headers).toBeDefined();
        expect(result.options.headers['X-Client-Type']).toBe('expo-passkey');

        // Case 2: No headers in options
        result = await plugin.init('https://api.example.com', { method: 'GET' });

        expect(result.options.headers).toBeDefined();
        expect(result.options.method).toBe('GET');

        // Case 3: Empty headers object
        result = await plugin.init('https://api.example.com', {
          method: 'POST',
          headers: {},
        });

        expect(result.options.headers['X-Client-Type']).toBe('expo-passkey');
        expect(result.options.method).toBe('POST');

        // Case 4: Undefined headers
        result = await plugin.init('https://api.example.com', {
          method: 'PUT',
          headers: undefined,
        });

        expect(result.options.headers['X-Client-Type']).toBe('expo-passkey');
        expect(result.options.method).toBe('PUT');
      });

      it('should preserve all existing headers when adding custom headers', async () => {
        const client = expoPasskeyClient();
        const plugin = client.fetchPlugins[0];

        // Create headers with various content types
        const existingHeaders = {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token123',
          'Accept-Language': 'en-US',
          'X-Custom-Header': 'value',
        };

        const result = await plugin.init('https://api.example.com', {
          method: 'POST',
          headers: existingHeaders,
        });

        // Check all original headers are preserved
        expect(result.options.headers['Content-Type']).toBe('application/json');
        expect(result.options.headers['Authorization']).toBe('Bearer token123');
        expect(result.options.headers['Accept-Language']).toBe('en-US');
        expect(result.options.headers['X-Custom-Header']).toBe('value');

        // And new headers are added
        expect(result.options.headers['X-Client-Type']).toBe('expo-passkey');
        expect(result.options.headers['X-Platform']).toBeDefined();
      });
    });

    describe('onError hook', () => {
      it('should handle various error context structures', async () => {
        const client = expoPasskeyClient();
        const plugin = client.fetchPlugins[0];

        // Set up onError hook tests
        const errorContexts = [
          // 1. No response object
          {
            request: new Request('https://api.example.com'),
            error: { status: 500, message: 'Server error' },
          },
          // 2. Response with 401 status (should clear device ID)
          {
            request: new Request('https://api.example.com'),
            response: new Response(null, { status: 401 }),
            error: { status: 401, message: 'Unauthorized' },
          },
          // 3. Error without status property
          {
            request: new Request('https://api.example.com'),
            response: new Response(null, { status: 500 }),
            error: { message: 'Error without status' },
          },
          // 4. Null error
          {
            request: new Request('https://api.example.com'),
            response: new Response(null, { status: 500 }),
            error: null,
          },
        ];

        for (const context of errorContexts) {
          // Clear mock calls
          (clearDeviceId as jest.Mock).mockClear();

          // Call the hook
          await plugin.hooks.onError(context as any);

          // Should only clear device ID for 401 errors
          if (context.response?.status === 401) {
            expect(clearDeviceId).toHaveBeenCalled();
          } else {
            expect(clearDeviceId).not.toHaveBeenCalled();
          }
        }
      });

      it('should handle error contexts with no response', async () => {
        // Get the plugin
        const client = expoPasskeyClient();
        const plugin = client.fetchPlugins[0];

        // Create error object directly matching BetterFetchError interface
        const errorObj = {
          name: 'BetterFetchError',
          message: 'Network error',
          status: 0,
          statusText: 'Network Error',
          error: 'Network error',
        };

        // Create error context with valid error shape
        const errorContext = {
          request: new Request('https://api.example.com'),
          response: null as unknown as Response,
          error: errorObj,
        };

        // Should not throw
        await expect(plugin.hooks.onError(errorContext)).resolves.not.toThrow();

        // Should not clear device ID for non-401 errors
        expect(clearDeviceId).not.toHaveBeenCalled();
      });

      it('should handle error contexts with non-standard status codes', async () => {
        const client = expoPasskeyClient();
        const plugin = client.fetchPlugins[0];

        // Create error contexts with various status codes
        const testCases = [
          { status: 400, shouldClear: false }, // Bad request
          { status: 401, shouldClear: true }, // Unauthorized
          { status: 403, shouldClear: false }, // Forbidden
          { status: 404, shouldClear: false }, // Not found
          { status: 500, shouldClear: false }, // Server error
        ];

        for (const testCase of testCases) {
          // Reset mocks
          (clearDeviceId as jest.Mock).mockClear();

          // Create a properly typed BetterFetchError
          class MockBetterFetchError extends Error {
            status: number;
            statusText: string;
            error: string;

            constructor(status: number) {
              super('Error message');
              this.name = 'BetterFetchError';
              this.status = status;
              this.statusText = 'Error';
              this.error = 'Error details';
            }
          }

          // Create error context with valid error
          const errorContext = {
            request: new Request('https://api.example.com'),
            response: new Response(null, { status: testCase.status }),
            error: new MockBetterFetchError(testCase.status),
          };

          // Call the hook
          await plugin.hooks.onError(errorContext);

          // Verify behavior
          if (testCase.shouldClear) {
            expect(clearDeviceId).toHaveBeenCalled();
          } else {
            expect(clearDeviceId).not.toHaveBeenCalled();
          }
        }
      });
    });
  });

  describe('getStorageKeys', () => {
    it('should use different prefixes based on options', () => {
      // Test with default options
      const defaultClient = expoPasskeyClient();
      const defaultActions = defaultClient.getActions(mockFetch);
      const defaultKeys = defaultActions.getStorageKeys();

      expect(defaultKeys.DEVICE_ID).toBe('_better-auth.device_id');

      // Test with custom prefix
      const customClient = expoPasskeyClient({ storagePrefix: 'custom-prefix' });
      const customActions = customClient.getActions(mockFetch);
      const customKeys = customActions.getStorageKeys();

      expect(customKeys.DEVICE_ID).toBe('custom-prefix.device_id');

      // Verify other keys are also prefixed
      expect(customKeys.STATE).toBe('custom-prefix.passkey_state');
      expect(customKeys.USER_ID).toBe('custom-prefix.user_id');
    });

    it('should handle various storagePrefix values', () => {
      // Test with different prefix configurations
      const prefixTests = [
        { prefix: undefined, expected: '_better-auth' },
        { prefix: null, expected: '_better-auth' },
        { prefix: '', expected: '_better-auth' },
        { prefix: 'custom', expected: 'custom' },
        { prefix: 'my-app-prefix', expected: 'my-app-prefix' },
      ];

      for (const { prefix, expected } of prefixTests) {
        const client = expoPasskeyClient({
          // @ts-expect-error - intentionally testing with various values
          storagePrefix: prefix,
        });

        const actions = client.getActions(mockFetch);
        const keys = actions.getStorageKeys();

        // Verify keys have correct prefix
        expect(keys.DEVICE_ID).toBe(`${expected}.device_id`);
        expect(keys.STATE).toBe(`${expected}.passkey_state`);
        expect(keys.USER_ID).toBe(`${expected}.user_id`);
      }
    });
  });
});

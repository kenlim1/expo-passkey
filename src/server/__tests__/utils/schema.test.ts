import {
  authenticatePasskeySchema,
  listPasskeysParamsSchema,
  listPasskeysQuerySchema,
  registerPasskeySchema,
  revokePasskeySchema,
} from "../../utils";

describe("Schema definitions", () => {
  describe("registerPasskeySchema", () => {
    it("should validate correct data", () => {
      const validData = {
        userId: "user-123",
        deviceId: "device-123",
        platform: "ios",
        metadata: {
          deviceName: "iPhone 14",
          deviceModel: "iPhone14,3",
          appVersion: "1.0.0",
          manufacturer: "Apple",
          biometricType: "Face ID",
        },
      };

      const result = registerPasskeySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should allow minimal data", () => {
      const minimalData = {
        userId: "user-123",
        deviceId: "device-123",
        platform: "ios",
        // No metadata
      };

      const result = registerPasskeySchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid data", () => {
      // Missing required fields
      const invalidData1 = {
        userId: "user-123",
        // Missing deviceId
        platform: "ios",
      };

      const result1 = registerPasskeySchema.safeParse(invalidData1);
      expect(result1.success).toBe(false);

      // Invalid metadata type
      const invalidData2 = {
        userId: "user-123",
        deviceId: "device-123",
        platform: "ios",
        metadata: "not-an-object", // Should be an object
      };

      const result2 = registerPasskeySchema.safeParse(invalidData2);
      expect(result2.success).toBe(false);
    });
  });

  describe("authenticatePasskeySchema", () => {
    it("should validate correct data", () => {
      const validData = {
        deviceId: "device-123",
        metadata: {
          lastLocation: "mobile-app",
          appVersion: "1.0.0",
          deviceModel: "iPhone14,3",
          manufacturer: "Apple",
          biometricType: "Face ID",
        },
      };

      const result = authenticatePasskeySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should allow minimal data", () => {
      const minimalData = {
        deviceId: "device-123",
        // No metadata
      };

      const result = authenticatePasskeySchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid data", () => {
      // Missing required fields
      const invalidData = {
        // Missing deviceId
        metadata: {
          lastLocation: "mobile-app",
        },
      };

      const result = authenticatePasskeySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("listPasskeysQuerySchema", () => {
    it("should validate correct query parameters", () => {
      const validQuery = {
        limit: "10",
        offset: "20",
      };

      const result = listPasskeysQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it("should allow empty query parameters", () => {
      const emptyQuery = {};

      const result = listPasskeysQuerySchema.safeParse(emptyQuery);
      expect(result.success).toBe(true);
    });
  });

  describe("listPasskeysParamsSchema", () => {
    it("should validate correct parameters", () => {
      const validParams = {
        userId: "user-123",
      };

      const result = listPasskeysParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it("should reject missing userId", () => {
      const invalidParams = {
        // Missing userId
      };

      const result = listPasskeysParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });

  describe("revokePasskeySchema", () => {
    it("should validate correct data", () => {
      const validData = {
        userId: "user-123",
        deviceId: "device-123",
        reason: "lost_device",
      };

      const result = revokePasskeySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should allow omitting reason", () => {
      const dataWithoutReason = {
        userId: "user-123",
        deviceId: "device-123",
        // No reason
      };

      const result = revokePasskeySchema.safeParse(dataWithoutReason);
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      // Missing userId
      const invalidData1 = {
        deviceId: "device-123",
      };

      const result1 = revokePasskeySchema.safeParse(invalidData1);
      expect(result1.success).toBe(false);

      // Missing deviceId
      const invalidData2 = {
        userId: "user-123",
      };

      const result2 = revokePasskeySchema.safeParse(invalidData2);
      expect(result2.success).toBe(false);
    });
  });
});

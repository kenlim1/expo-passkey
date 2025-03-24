import { ERROR_CODES as ErrorsFromTypes } from "../../types";
import { expoPasskey as ExpoPasskeyFromCore } from "../core";
import * as serverExports from "../index";

describe("expo-passkey/server module exports", () => {
  it("should export ERROR_CODES from types/errors", () => {
    expect(serverExports.ERROR_CODES).toBe(ErrorsFromTypes);
  });

  it("should export expoPasskey from server/core", () => {
    expect(serverExports.expoPasskey).toBe(ExpoPasskeyFromCore);
  });

  it("should export exactly ERROR_CODES and expoPasskey", () => {
    // Ensure no additional exports have been accidentally added
    expect(Object.keys(serverExports).sort()).toEqual(
      ["ERROR_CODES", "expoPasskey"].sort(),
    );
  });
});

import { createRateLimits } from "../../utils/rate-limit";

describe("Rate limit utility", () => {
  it("should create rate limits with default options", () => {
    const rateLimits = createRateLimits();

    expect(rateLimits).toHaveLength(3);

    // Check register endpoint rate limit
    const registerLimit = rateLimits.find((limit) =>
      limit.pathMatcher("/expo-passkey/register"),
    );
    expect(registerLimit).toBeDefined();
    expect(registerLimit?.window).toBe(300); // 300 seconds by default
    expect(registerLimit?.max).toBe(3); // 3 attempts by default

    // Check authenticate endpoint rate limit
    const authenticateLimit = rateLimits.find((limit) =>
      limit.pathMatcher("/expo-passkey/authenticate"),
    );
    expect(authenticateLimit).toBeDefined();
    expect(authenticateLimit?.window).toBe(60); // 60 seconds by default
    expect(authenticateLimit?.max).toBe(5); // 5 attempts by default

    // Check global rate limit for all passkey paths
    const globalLimit = rateLimits.find((limit) =>
      limit.pathMatcher("/expo-passkey/something-else"),
    );
    expect(globalLimit).toBeDefined();
    expect(globalLimit?.window).toBe(60); // 60 seconds
    expect(globalLimit?.max).toBe(30); // 30 attempts for all routes
  });

  it("should respect custom rate limit options", () => {
    const customOptions = {
      registerWindow: 600, // 10 minutes
      registerMax: 5, // 5 attempts
      authenticateWindow: 120, // 2 minutes
      authenticateMax: 3, // 3 attempts
    };

    const rateLimits = createRateLimits(customOptions);

    // Check register endpoint with custom options
    const registerLimit = rateLimits.find((limit) =>
      limit.pathMatcher("/expo-passkey/register"),
    );
    expect(registerLimit?.window).toBe(600);
    expect(registerLimit?.max).toBe(5);

    // Check authenticate endpoint with custom options
    const authenticateLimit = rateLimits.find((limit) =>
      limit.pathMatcher("/expo-passkey/authenticate"),
    );
    expect(authenticateLimit?.window).toBe(120);
    expect(authenticateLimit?.max).toBe(3);
  });

  it("should handle partial custom options", () => {
    // Only specify some of the options
    const partialOptions = {
      registerWindow: 600, // 10 minutes
      // registerMax not specified, should use default
      // authenticateWindow not specified, should use default
      authenticateMax: 10, // 10 attempts
    };

    const rateLimits = createRateLimits(partialOptions);

    // Check register endpoint with custom window but default max
    const registerLimit = rateLimits.find((limit) =>
      limit.pathMatcher("/expo-passkey/register"),
    );
    expect(registerLimit?.window).toBe(600);
    expect(registerLimit?.max).toBe(3); // Default

    // Check authenticate endpoint with default window but custom max
    const authenticateLimit = rateLimits.find((limit) =>
      limit.pathMatcher("/expo-passkey/authenticate"),
    );
    expect(authenticateLimit?.window).toBe(60); // Default
    expect(authenticateLimit?.max).toBe(10);
  });

  it("should have correct path matchers", () => {
    const rateLimits = createRateLimits();

    // Register path matcher
    const registerMatcher = rateLimits.find((limit) =>
      limit.pathMatcher("/expo-passkey/register"),
    )?.pathMatcher;

    expect(registerMatcher).toBeDefined();
    expect(registerMatcher?.("/expo-passkey/register")).toBe(true);
    expect(registerMatcher?.("/expo-passkey/register/something")).toBe(false);
    expect(registerMatcher?.("/expo-passkey/authenticate")).toBe(false);

    // Authenticate path matcher
    const authenticateMatcher = rateLimits.find((limit) =>
      limit.pathMatcher("/expo-passkey/authenticate"),
    )?.pathMatcher;

    expect(authenticateMatcher).toBeDefined();
    expect(authenticateMatcher?.("/expo-passkey/authenticate")).toBe(true);
    expect(authenticateMatcher?.("/expo-passkey/authenticate/something")).toBe(
      false,
    );
    expect(authenticateMatcher?.("/expo-passkey/register")).toBe(false);

    // Global path matcher
    const globalMatcher = rateLimits.find((limit) =>
      limit.pathMatcher("/expo-passkey/list/user-123"),
    )?.pathMatcher;

    expect(globalMatcher).toBeDefined();
    expect(globalMatcher?.("/expo-passkey/list/user-123")).toBe(true);
    expect(globalMatcher?.("/expo-passkey/revoke")).toBe(true);
    expect(globalMatcher?.("/expo-passkey/register")).toBe(true); // Should match all passkey paths
    expect(globalMatcher?.("/other-path")).toBe(false); // Should not match non-passkey paths
  });
});

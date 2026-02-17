import { describe, it, expect, beforeEach, vi } from "vitest";
import { resolveUser, clearUserCache } from "../user-identity.js";
import { ApiClient } from "../api-client.js";
import { Config } from "../config.js";

function createMockApiClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  } as unknown as ApiClient;
}

function createMockConfig(username = "_SYSTEM"): Config {
  return {
    baseUrl: "http://localhost:52773",
    username,
    password: "SYS",
  };
}

const activeUsers = [
  { id: 1, irisUsername: "_SYSTEM", displayName: "Spectra", isActive: true },
  { id: 2, irisUsername: "jdoe", displayName: "Joe", isActive: true },
];

describe("resolveUser", () => {
  let mockApiClient: ReturnType<typeof createMockApiClient>;

  beforeEach(() => {
    clearUserCache();
    mockApiClient = createMockApiClient();
    (mockApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(activeUsers);
  });

  it("returns the specified user when it matches an active mapping (AC #1)", async () => {
    const result = await resolveUser(mockApiClient, createMockConfig(), "Joe");

    expect(result.actorName).toBe("Joe");
    expect(result.actorType).toBe("agent");
  });

  it("throws error when user does not match any active mapping (AC #2)", async () => {
    await expect(
      resolveUser(mockApiClient, createMockConfig(), "NonExistentUser")
    ).rejects.toThrow('Invalid user: "NonExistentUser" does not match any active user mapping');
  });

  it("error message lists valid display names (AC #2)", async () => {
    await expect(
      resolveUser(mockApiClient, createMockConfig(), "BadName")
    ).rejects.toThrow("Valid display names: Spectra, Joe");
  });

  it("defaults to mapped display name when no user param provided (AC #3)", async () => {
    const result = await resolveUser(mockApiClient, createMockConfig("_SYSTEM"));

    expect(result.actorName).toBe("Spectra");
    expect(result.actorType).toBe("agent");
  });

  it("performs case-insensitive IRIS username lookup (AC #3)", async () => {
    const result = await resolveUser(mockApiClient, createMockConfig("_system"));

    expect(result.actorName).toBe("Spectra");
  });

  it("falls back to IRIS username when no mapping exists (AC #4)", async () => {
    const result = await resolveUser(mockApiClient, createMockConfig("UnmappedUser"));

    expect(result.actorName).toBe("UnmappedUser");
    expect(result.actorType).toBe("agent");
  });

  it("fetches users from /users?isActive=true", async () => {
    await resolveUser(mockApiClient, createMockConfig(), "Spectra");

    expect(mockApiClient.get).toHaveBeenCalledWith("/users", { isActive: "true" });
  });

  it("caches user list across consecutive calls", async () => {
    await resolveUser(mockApiClient, createMockConfig(), "Spectra");
    await resolveUser(mockApiClient, createMockConfig(), "Joe");

    // Only one GET call despite two resolveUser calls
    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
  });

  it("treats empty string user param same as undefined (fallback)", async () => {
    const result = await resolveUser(mockApiClient, createMockConfig("_SYSTEM"), "");

    expect(result.actorName).toBe("Spectra");
  });
});

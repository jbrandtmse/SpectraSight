import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getConfig } from "../config.js";

describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Suppress stderr warnings during tests
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Reset env vars before each test
    process.env = { ...originalEnv };
    delete process.env.SPECTRASIGHT_URL;
    delete process.env.SPECTRASIGHT_USERNAME;
    delete process.env.SPECTRASIGHT_PASSWORD;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns default values when env vars are not set", () => {
    const config = getConfig();
    expect(config.baseUrl).toBe("http://localhost:52773");
    expect(config.username).toBe("_SYSTEM");
    expect(config.password).toBe("SYS");
  });

  it("returns custom values when env vars are set", () => {
    process.env.SPECTRASIGHT_URL = "http://custom-host:9090";
    process.env.SPECTRASIGHT_USERNAME = "admin";
    process.env.SPECTRASIGHT_PASSWORD = "secret123";

    const config = getConfig();
    expect(config.baseUrl).toBe("http://custom-host:9090");
    expect(config.username).toBe("admin");
    expect(config.password).toBe("secret123");
  });

  it("returns an object with baseUrl, username, and password keys", () => {
    const config = getConfig();
    expect(config).toHaveProperty("baseUrl");
    expect(config).toHaveProperty("username");
    expect(config).toHaveProperty("password");
    expect(Object.keys(config)).toHaveLength(3);
  });

  it("logs warning to stderr when SPECTRASIGHT_URL is not set", () => {
    getConfig();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("SPECTRASIGHT_URL not set")
    );
  });

  it("does not log URL warning when SPECTRASIGHT_URL is set", () => {
    process.env.SPECTRASIGHT_URL = "http://example.com";
    process.env.SPECTRASIGHT_USERNAME = "user";
    process.env.SPECTRASIGHT_PASSWORD = "pass";
    getConfig();
    expect(console.error).not.toHaveBeenCalledWith(
      expect.stringContaining("SPECTRASIGHT_URL not set")
    );
  });
});

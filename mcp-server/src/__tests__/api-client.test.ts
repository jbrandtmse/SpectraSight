import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApiClient, ApiError } from "../api-client.js";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function createClient() {
  return new ApiClient({
    baseUrl: "http://localhost:52773",
    username: "_SYSTEM",
    password: "SYS",
  });
}

function mockResponse(status: number, body?: unknown, ok?: boolean) {
  return {
    status,
    ok: ok !== undefined ? ok : status >= 200 && status < 300,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe("ApiClient", () => {
  let client: ApiClient;

  beforeEach(() => {
    client = createClient();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET requests", () => {
    it("sends correct URL with /api prefix and auth headers", async () => {
      mockFetch.mockResolvedValue(mockResponse(200, { data: { id: "SS-1" } }));
      await client.get("/tickets/SS-1");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:52773/api/tickets/SS-1",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Basic /),
          }),
        })
      );
    });

    it("appends query parameters correctly", async () => {
      mockFetch.mockResolvedValue(mockResponse(200, { data: [] }));
      await client.get("/tickets", { type: "bug", page: 1 });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      const url = new URL(calledUrl);
      expect(url.searchParams.get("type")).toBe("bug");
      expect(url.searchParams.get("page")).toBe("1");
    });

    it("omits undefined query parameters", async () => {
      mockFetch.mockResolvedValue(mockResponse(200, { data: [] }));
      await client.get("/tickets", { type: "bug", status: undefined });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      const url = new URL(calledUrl);
      expect(url.searchParams.get("type")).toBe("bug");
      expect(url.searchParams.has("status")).toBe(false);
    });
  });

  describe("POST requests", () => {
    it("sends correct body and Content-Type header", async () => {
      const body = { title: "Test", type: "bug" };
      mockFetch.mockResolvedValue(mockResponse(201, { data: { id: "SS-1", ...body } }));
      await client.post("/tickets", body);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:52773/api/tickets",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(body),
        })
      );
    });
  });

  describe("PUT requests", () => {
    it("sends correct body with PUT method", async () => {
      const body = { title: "Updated" };
      mockFetch.mockResolvedValue(mockResponse(200, { data: { id: "SS-1", title: "Updated" } }));
      await client.put("/tickets/SS-1", body);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:52773/api/tickets/SS-1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(body),
        })
      );
    });
  });

  describe("DELETE requests", () => {
    it("sends correct DELETE method", async () => {
      mockFetch.mockResolvedValue(mockResponse(204));
      await client.del("/tickets/SS-1");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:52773/api/tickets/SS-1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });

    it("returns undefined for 204 No Content", async () => {
      mockFetch.mockResolvedValue(mockResponse(204));
      const result = await client.del("/tickets/SS-1");
      expect(result).toBeUndefined();
    });
  });

  describe("response handling", () => {
    it("extracts data field from success response", async () => {
      const ticket = { id: "SS-1", title: "Test" };
      mockFetch.mockResolvedValue(mockResponse(200, { data: ticket }));
      const result = await client.get("/tickets/SS-1");
      expect(result).toEqual(ticket);
    });

    it("returns full envelope for paginated responses (has total field)", async () => {
      const paginated = {
        data: [{ id: "SS-1" }],
        total: 1,
        page: 1,
        pageSize: 25,
        totalPages: 1,
      };
      mockFetch.mockResolvedValue(mockResponse(200, paginated));
      const result = await client.get("/tickets");
      expect(result).toEqual(paginated);
    });
  });

  describe("error handling", () => {
    it("throws ApiError with code, message, status from REST error envelope", async () => {
      const errorBody = {
        error: { code: "NOT_FOUND", message: "Ticket not found", status: 404 },
      };
      mockFetch.mockResolvedValue(mockResponse(404, errorBody, false));

      await expect(client.get("/tickets/SS-999")).rejects.toThrow(ApiError);

      try {
        await client.get("/tickets/SS-999");
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe("NOT_FOUND");
        expect(apiErr.message).toBe("Ticket not found");
        expect(apiErr.status).toBe(404);
      }
    });

    it("throws CONNECTION_ERROR with 'connection refused' message on ECONNREFUSED", async () => {
      expect.assertions(3);
      mockFetch.mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:52773"));

      try {
        await client.get("/tickets");
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe("CONNECTION_ERROR");
        expect(apiErr.message).toBe("Cannot connect to SpectraSight API at http://localhost:52773 — connection refused. Is IRIS running?");
        expect(apiErr.status).toBe(0);
      }
    });

    it("throws CONNECTION_ERROR with 'check URL' message on ETIMEDOUT", async () => {
      expect.assertions(3);
      mockFetch.mockRejectedValue(new Error("connect ETIMEDOUT 10.0.0.1:52773"));

      try {
        await client.get("/tickets");
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe("CONNECTION_ERROR");
        expect(apiErr.message).toBe("Cannot reach SpectraSight API at http://localhost:52773 — check SPECTRASIGHT_URL");
        expect(apiErr.status).toBe(0);
      }
    });

    it("throws CONNECTION_ERROR with 'check URL' message on ENOTFOUND", async () => {
      expect.assertions(2);
      mockFetch.mockRejectedValue(new Error("getaddrinfo ENOTFOUND badhost"));

      try {
        await client.get("/tickets");
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.message).toContain("Cannot reach SpectraSight API");
        expect(apiErr.message).toContain("check SPECTRASIGHT_URL");
      }
    });

    it("throws CONNECTION_ERROR with generic network message for other errors", async () => {
      expect.assertions(2);
      mockFetch.mockRejectedValue(new Error("socket hang up"));

      try {
        await client.get("/tickets");
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe("CONNECTION_ERROR");
        expect(apiErr.message).toBe("Network error connecting to SpectraSight API at http://localhost:52773: socket hang up");
      }
    });

    it("throws AUTH_FAILED with credential guidance on 401", async () => {
      expect.assertions(4);
      mockFetch.mockResolvedValue(mockResponse(401, { error: { message: "Unauthorized" } }, false));

      try {
        await client.get("/tickets");
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe("AUTH_FAILED");
        expect(apiErr.message).toContain("Authentication failed");
        expect(apiErr.message).toContain("SPECTRASIGHT_USERNAME");
        expect(apiErr.status).toBe(401);
      }
    });

    it("throws AUTH_FORBIDDEN with permissions message on 403", async () => {
      expect.assertions(3);
      mockFetch.mockResolvedValue(mockResponse(403, { error: { message: "Forbidden" } }, false));

      try {
        await client.get("/tickets");
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe("AUTH_FORBIDDEN");
        expect(apiErr.message).toContain("Access denied");
        expect(apiErr.status).toBe(403);
      }
    });

    it("throws AUTH_FAILED even when 401 response body is not JSON", async () => {
      expect.assertions(2);
      mockFetch.mockResolvedValue({
        status: 401,
        ok: false,
        json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
      });

      try {
        await client.get("/tickets");
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe("AUTH_FAILED");
        expect(apiErr.status).toBe(401);
      }
    });

    it("throws ApiError with PARSE_ERROR when response is not JSON", async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
      });

      await expect(client.get("/tickets")).rejects.toThrow(ApiError);

      try {
        await client.get("/tickets");
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe("PARSE_ERROR");
      }
    });

    it("uses fallback error fields when error envelope is incomplete", async () => {
      expect.assertions(2);
      mockFetch.mockResolvedValue(mockResponse(500, {}, false));

      try {
        await client.get("/tickets");
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe("UNKNOWN_ERROR");
        expect(apiErr.status).toBe(500);
      }
    });

    it("includes base URL in connection error messages", async () => {
      expect.assertions(1);
      const customClient = new ApiClient({
        baseUrl: "http://custom-host:9999",
        username: "user",
        password: "pass",
      });
      mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

      try {
        await customClient.get("/tickets");
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.message).toContain("http://custom-host:9999");
      }
    });

    it("includes base URL in auth error messages", async () => {
      expect.assertions(1);
      const customClient = new ApiClient({
        baseUrl: "http://custom-host:9999",
        username: "user",
        password: "pass",
      });
      mockFetch.mockResolvedValue(mockResponse(401, {}, false));

      try {
        await customClient.get("/tickets");
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.message).toContain("http://custom-host:9999");
      }
    });
  });

  describe("authentication", () => {
    it("sends Base64-encoded Basic auth header", async () => {
      mockFetch.mockResolvedValue(mockResponse(200, { data: {} }));
      await client.get("/tickets");

      const expectedAuth = `Basic ${Buffer.from("_SYSTEM:SYS").toString("base64")}`;
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expectedAuth,
          }),
        })
      );
    });
  });
});

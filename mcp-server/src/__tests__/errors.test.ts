import { describe, it, expect } from "vitest";
import { formatError } from "../errors.js";
import { ApiError } from "../api-client.js";

describe("formatError", () => {
  it("returns structured message for ApiError", () => {
    const apiError = new ApiError("NOT_FOUND", "Ticket not found", 404);
    const result = formatError(apiError);

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toBe("Error [NOT_FOUND]: Ticket not found");
  });

  it("returns generic message for standard Error", () => {
    const error = new Error("Something went wrong");
    const result = formatError(error);

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toBe("Error: Something went wrong");
  });

  it("handles non-Error values (e.g., strings)", () => {
    const result = formatError("unexpected string error");

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Error: unexpected string error");
  });

  it("preserves ApiError code in formatted output", () => {
    const apiError = new ApiError("CONNECTION_ERROR", "Cannot connect", 0);
    const result = formatError(apiError);

    expect(result.content[0].text).toContain("CONNECTION_ERROR");
    expect(result.content[0].text).toContain("Cannot connect");
  });
});

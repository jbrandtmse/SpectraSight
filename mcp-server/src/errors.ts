import { ApiError } from "./api-client.js";

export function formatError(err: unknown): { content: Array<{ type: "text"; text: string }>; isError: true } {
  if (err instanceof ApiError) {
    return {
      content: [{ type: "text", text: `Error [${err.code}]: ${err.message}` }],
      isError: true,
    };
  }
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}

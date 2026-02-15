import { Config } from "./config.js";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export class ApiClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(config: Config) {
    this.baseUrl = config.baseUrl;
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString("base64");
    this.authHeader = `Basic ${credentials}`;
  }

  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    const url = new URL(`/api${path}`, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private async request(method: string, path: string, options?: {
    body?: unknown;
    params?: Record<string, string | number | undefined>;
  }): Promise<unknown> {
    const url = this.buildUrl(path, options?.params);
    const headers: Record<string, string> = {
      "Authorization": this.authHeader,
    };

    const jsonBody = options?.body ? JSON.stringify(options.body) : undefined;
    if (jsonBody !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: jsonBody,
      });
    } catch (err) {
      throw new ApiError(
        "CONNECTION_ERROR",
        `Failed to connect to SpectraSight API at ${this.baseUrl}: ${err instanceof Error ? err.message : String(err)}`,
        0
      );
    }

    if (response.status === 204) {
      return undefined;
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new ApiError(
        "PARSE_ERROR",
        `Failed to parse response from ${method} ${path}`,
        response.status
      );
    }

    if (!response.ok) {
      const errorBody = json as { error?: { code?: string; message?: string; status?: number } };
      const err = errorBody?.error;
      throw new ApiError(
        err?.code || "UNKNOWN_ERROR",
        err?.message || `HTTP ${response.status} from ${method} ${path}`,
        err?.status || response.status
      );
    }

    const body = json as { data?: unknown; total?: unknown };
    // Return full envelope for paginated responses (has total field)
    if (body.total !== undefined) {
      return json;
    }
    return body.data !== undefined ? body.data : json;
  }

  async get(path: string, params?: Record<string, string | number | undefined>): Promise<unknown> {
    return this.request("GET", path, { params });
  }

  async post(path: string, body: unknown): Promise<unknown> {
    return this.request("POST", path, { body });
  }

  async put(path: string, body: unknown): Promise<unknown> {
    return this.request("PUT", path, { body });
  }

  async del(path: string): Promise<unknown> {
    return this.request("DELETE", path);
  }
}

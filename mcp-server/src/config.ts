export interface Config {
  baseUrl: string;
  username: string;
  password: string;
}

export function getConfig(): Config {
  const baseUrl = process.env.SPECTRASIGHT_URL || "http://localhost:52773";
  const username = process.env.SPECTRASIGHT_USERNAME || "_SYSTEM";
  const password = process.env.SPECTRASIGHT_PASSWORD || "SYS";

  if (!process.env.SPECTRASIGHT_URL) {
    console.error("[spectrasight-mcp] SPECTRASIGHT_URL not set, using default: http://localhost:52773");
  }
  if (!process.env.SPECTRASIGHT_USERNAME) {
    console.error("[spectrasight-mcp] SPECTRASIGHT_USERNAME not set, using default: _SYSTEM");
  }
  if (!process.env.SPECTRASIGHT_PASSWORD) {
    console.error("[spectrasight-mcp] SPECTRASIGHT_PASSWORD not set, using default credentials");
  }

  return { baseUrl, username, password };
}

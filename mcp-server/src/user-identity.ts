import { ApiClient } from "./api-client.js";
import { Config } from "./config.js";

interface UserMapping {
  id: number;
  irisUsername: string;
  displayName: string;
  isActive: boolean;
}

interface ResolvedIdentity {
  actorName: string;
  actorType: string;
}

let cachedUsers: UserMapping[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

async function getActiveUsers(apiClient: ApiClient): Promise<UserMapping[]> {
  const now = Date.now();
  if (cachedUsers !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedUsers;
  }

  const data = await apiClient.get("/users", { isActive: "true" }) as UserMapping[];
  cachedUsers = data;
  cacheTimestamp = now;
  return cachedUsers;
}

export async function resolveUser(
  apiClient: ApiClient,
  config: Config,
  userParam?: string
): Promise<ResolvedIdentity> {
  const users = await getActiveUsers(apiClient);

  if (userParam !== undefined && userParam !== "") {
    // Validate against active user mappings
    const match = users.find((u) => u.displayName === userParam);
    if (!match) {
      const validNames = users.map((u) => u.displayName).join(", ");
      throw new Error(
        `Invalid user: "${userParam}" does not match any active user mapping. Valid display names: ${validNames}`
      );
    }
    return { actorName: userParam, actorType: "agent" };
  }

  // No user param — look up config username in mappings
  const configUsername = config.username;
  const mapping = users.find(
    (u) => u.irisUsername.toLowerCase() === configUsername.toLowerCase()
  );
  if (mapping) {
    return { actorName: mapping.displayName, actorType: "agent" };
  }

  // Graceful fallback: use IRIS username as-is
  return { actorName: configUsername, actorType: "agent" };
}

/** Clear the user cache (useful for testing) */
export function clearUserCache(): void {
  cachedUsers = null;
  cacheTimestamp = 0;
}

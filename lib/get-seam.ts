import { SeamHttp } from "@seamapi/http/connect"
import { getConfigStore } from "./get-config-store"
import { getServer } from "./get-server"

export const getSeam = () => {
  const config = getConfigStore()

  const token = config.get(`${getServer()}.pat`)
  const token_type = token.startsWith("seam_at")
    ? "pat"
    : token.startsWith("ey")
      ? "console-session-token"
      : "api-key"

  return new SeamHttp({
    endpoint: getServer(),

    personalAccessToken: token_type === "pat" ? token : undefined,
    consoleSessionToken:
      token_type === "console-session-token" ? token : undefined,
    apiKey: token_type === "api-key" ? token : undefined,
    // https://github.com/seamapi/javascript-http/issues/30
    workspaceId: config.get("current_workspace_id"),
  })
}

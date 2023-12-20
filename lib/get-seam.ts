import { SeamHttp, SeamHttpMultiWorkspace } from "@seamapi/http/connect"
import { getConfigStore } from "./get-config-store"
import { getServer } from "./get-server"

export const getSeam = async (): Promise<SeamHttp> => {
  const config = getConfigStore()

  const token = config.get(`${getServer()}.pat`)

  const token_type = token.startsWith("seam_at")
    ? "pat"
    : token.startsWith("ey")
      ? "console-session-token"
      : null

  const workspaceId = config.get("current_workspace_id")

  const options = { endpoint: getServer() }

  if (token_type === "pat") {
    return SeamHttp.fromPersonalAccessToken(token, workspaceId, options)
  }

  if (token_type === "console-session-token") {
    return SeamHttp.fromConsoleSessionToken(token, workspaceId, options)
  }

  return SeamHttp.fromApiKey(token, options)
}

export const getSeamMultiWorkspace =
  async (): Promise<SeamHttpMultiWorkspace> => {
    const config = getConfigStore()
    const token = config.get(`${getServer()}.pat`)
    const options = { endpoint: getServer() }
    return SeamHttpMultiWorkspace.fromPersonalAccessToken(token, options)
  }

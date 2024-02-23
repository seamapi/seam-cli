import {
  SeamHttp,
  SeamHttpMultiWorkspace,
  isApiKey,
} from "@seamapi/http/connect"
import { getConfigStore } from "./get-config-store"
import { getServer } from "./get-server"

export const getSeam = async (): Promise<SeamHttp> => {
  const config = getConfigStore()

  const token = config.get(`${getServer()}.pat`)

  console.log("hi")
  const workspaceId = config.get("current_workspace_id")

  const options = { endpoint: getServer() }

  if (token.startsWith("seam_at")) {
    return SeamHttp.fromPersonalAccessToken(token, workspaceId, options)
  }

  if (token.startsWith("ey")) {
    return SeamHttp.fromConsoleSessionToken(token, workspaceId, options)
  }

  return SeamHttp.fromApiKey(token, options)
}

export const getSeamMultiWorkspace = async (): Promise<
  SeamHttpMultiWorkspace | SeamHttp
> => {
  const config = getConfigStore()
  const token = config.get(`${getServer()}.pat`)
  const options = { endpoint: getServer() }
  if (isApiKey(token)) return SeamHttp.fromApiKey(token, options)
  return SeamHttpMultiWorkspace.fromPersonalAccessToken(token, options)
}

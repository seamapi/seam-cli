import { SeamHttp } from "@seamapi/http/connect"
import { getConfigStore } from "./get-config-store"
import { getServer } from "./get-server"

export const getSeam = () => {
  const config = getConfigStore()

  const token = config.get(`${getServer()}.pat`)
  const isPat = token.startsWith("seam_at")

  return new SeamHttp({
    endpoint: getServer(),

    personalAccessToken: isPat ? token : undefined,
    apiKey: isPat ? undefined : token,
    // https://github.com/seamapi/javascript-http/issues/30
    workspaceId: config.get("current_workspace_id"),
  })
}

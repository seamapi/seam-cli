import { SeamHttp } from "@seamapi/http/connect"
import { getConfigStore } from "./get-config-store"
import { getServer } from "./get-server"

export const getSeam = () => {
  const config = getConfigStore()

  return new SeamHttp({
    endpoint: getServer(),
    personalAccessToken: config.get(`${getServer()}.pat`),
    // https://github.com/seamapi/javascript-http/issues/30
    workspaceId: config.get("current_workspace_id"),
  })
}

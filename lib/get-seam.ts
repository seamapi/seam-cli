import { SeamHttp } from "@seamapi/http/connect"
import { getConfigStore } from "./get-config-store"

export const getSeam = () => {
  const config = getConfigStore()

  return new SeamHttp({
    personalAccessToken: config.get("pat"),
    workspaceId: config.get("current_workspace_id"),
  })
}

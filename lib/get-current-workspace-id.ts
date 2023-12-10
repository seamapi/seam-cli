import { getConfigStore } from "./get-config-store"

export const getCurrentWorkspaceId = async () => {
  const configStore = getConfigStore()

  const currentWorkspaceId = configStore.get("current_workspace_id")
  if (currentWorkspaceId) return currentWorkspaceId

  await interactForWorkspaceId()
}

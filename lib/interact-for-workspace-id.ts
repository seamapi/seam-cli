import { getConfigStore } from "./get-config-store"
import prompts from "prompts"
import { getSeamMultiWorkspace } from "./get-seam"

export const interactForWorkspaceId = async () => {
  const config = getConfigStore()
  const seam = await getSeamMultiWorkspace()
  const workspaces = await seam.workspaces.list()

  const { workspaceId } = await prompts({
    name: "workspaceId",
    type: "select",
    message: "Select a workspace:",
    choices: workspaces.map((workspace: any) => ({
      title: workspace.name,
      value: workspace.workspace_id,
      description: workspace.workspace_id,
    })),
  })

  if (workspaceId) {
    config.set("current_workspace_id", workspaceId)
    return workspaceId
  }

  throw new Error("Bailed")
}

import prompts from "prompts"
import { getSeam } from "./get-seam"

export const interactForWorkspaceId = async () => {
  const seam = await getSeam()
  const workspaces = await seam.workspaces.list()

  const { workspaceId } = await prompts({
    name: "workspaceId",
    type: "select",
    message: "Select a workspace:",
    choices: workspaces.map((workspace) => ({
      title: workspace.name,
      value: workspace.workspace_id,
      description: workspace.workspace_id,
    })),
  })
}

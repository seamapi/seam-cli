import { getConfigStore } from "./get-config-store"
import prompts from "prompts"
import { getSeam } from "./get-seam"
import axios from "redaxios"
import { getServer } from "./get-server"

export const interactForWorkspaceId = async () => {
  const config = getConfigStore()

  // const seam = await getSeam()
  // const workspaces = await seam.workspaces.list()
  // https://github.com/seamapi/javascript-http/issues/30

  const {
    data: { workspaces },
  } = await axios
    .get(`${getServer()}/workspaces/list`, {
      headers: {
        Authorization: `Bearer ${getConfigStore().get(`${getServer()}.pat`)}`,
      },
    })
    .catch((e) => {
      console.log(e?.response?.data)
      throw e
    })

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

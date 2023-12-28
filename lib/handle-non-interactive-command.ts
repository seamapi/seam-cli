import  isEqual  from "lodash/isEqual"
import { getServer } from "./get-server"
import { interactForLogin } from "./interact-for-login"
import { interactForServerSelection } from "./interact-for-server-selection"
import { interactForWorkspaceId } from "./interact-for-workspace-id"

export  default async function handleNonInteractiveCommand(selectedCommand: string[], args: any, config: any) {
  if (isEqual(selectedCommand, ["login"])) {
    console.log(selectedCommand);
    if (args.server) {
      config.set("server", args.server)
      config.delete("current_workspace_id")
    }
    if (args.token) {
      config.set(`${getServer()}.pat`, args.token)
      config.delete("current_workspace_id")
    }
    if (args.workspace_id) {
      config.set(`current_workspace_id`, args.workspace_id)
    }
    if (args.token || args.workspace_id || args.server) {
      return
    }
    await interactForLogin()
    return
  } else if (isEqual(selectedCommand, ["logout"])) {
    config.delete("pat")
    console.log("Logged out!")
    return
  } else if (isEqual(selectedCommand, ["config", "reveal-location"])) {
    console.log(config.path)
    return
  } else if (isEqual(selectedCommand, ["select", "workspace"])) {
    await interactForWorkspaceId()
    return
  } else if (isEqual(selectedCommand, ["select", "server"])) {
    if (args.server) {
      config.set("server", args.server)
      config.delete("current_workspace_id")
      return
    }
    await interactForServerSelection()
    return
  }
}
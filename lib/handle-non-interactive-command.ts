import  isEqual  from "lodash/isEqual"
import { getServer } from "./get-server"
import { interactForLogin } from "./interact-for-login"
import { interactForServerSelection } from "./interact-for-server-selection"
import { interactForWorkspaceId } from "./interact-for-workspace-id"
import { getSeam } from "./get-seam"
import chalk from "chalk"
import logResponse from "./util/log-response"
import { pollActionAttemptUntilReady } from "./util/poll-action-attempt-until-ready"
import prompts from "prompts"

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

  const seam = await getSeam()

  const apiPath = `/${selectedCommand.join("/").replace(/-/g, "_")}`

  console.log(`\n\n${chalk.green(apiPath)}`)
  console.log(`Request Params:`)

  const response = await seam.client.post(apiPath, selectedCommand, {
    validateStatus: () => true,
  })

  logResponse(response)

  if ("action_attempt" in response.data) {
    const { poll_for_action_attempt } = await prompts({
      name: "poll_for_action_attempt",
      message: "Would you like to poll the action attempt until it's ready?",
      type: "toggle",
      initial: true,
      active: "yes",
      inactive: "no",
    })

    if (poll_for_action_attempt) {
      await pollActionAttemptUntilReady(
        response.data.action_attempt.action_attempt_id
      )
    }
  }
}
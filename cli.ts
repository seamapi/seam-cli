#!/usr/bin/env node
import isEqual from "lodash/isEqual"
import { getCommandOpenApiDef } from "./lib/get-command-open-api-def"
import { getConfigStore } from "./lib/get-config-store"
import { interactForCommandParams } from "./lib/interact-for-command-params"
import { interactForCommandSelection } from "./lib/interact-for-command-selection"
import parseArgs, { ParsedArgs } from "minimist"
import { interactForLogin } from "./lib/interact-for-login"
import { interactForWorkspaceId } from "./lib/interact-for-workspace-id"
import { getSeam } from "./lib/get-seam"
import chalk from "chalk"
import { interactForServerSelection } from "./lib/interact-for-server-selection"
import { getServer } from "./lib/get-server"
import prompts from "prompts"
import { pollActionAttemptUntilReady } from "./lib/poll-action-attempt-until-ready"

async function cli(args: ParsedArgs) {
  const config = getConfigStore()

  if (
    !config.get(`${getServer()}.pat`) &&
    args._[0] !== "login" &&
    !isEqual(args._, ["select", "server"])
  ) {
    console.log(`Not logged in. Please run "seam login"`)
    process.exit(1)
  }

  args._ = args._.map((arg) => arg.toLowerCase().replace(/_/g, "-"))
  const commandParams: any = {}
  for (const k in args) {
    if (k === "_") continue
    const v = args[k]
    delete args[k]
    args[k.replace(/-/g, "_")] = v
    commandParams[k.replace(/-/g, "_")] = v
  }

  const selectedCommand = await interactForCommandSelection(args._)
  if (isEqual(selectedCommand, ["login"])) {
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

  const params = await interactForCommandParams(selectedCommand, commandParams)
  const seam = await getSeam()

  const apiPath = `/${selectedCommand.join("/").replace(/-/g, "_")}`

  console.log(`\n\n${chalk.green(apiPath)}`)
  console.log(`Request Params:`)
  console.log(params)

  const response = await seam.client.post(apiPath, params, {
    validateStatus: () => true,
  })

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
      response.data.action_attempt = await pollActionAttemptUntilReady(
        response.data.action_attempt.action_attempt_id
      )
    }
  }

  if (response.status >= 400) {
    console.log(chalk.red(`\n\n[${response.status}]\n`))
  } else {
    console.log(chalk.green(`\n\n[${response.status}]`))
  }
  console.dir(response.data, { depth: null })
  console.log("\n")
}

cli(parseArgs(process.argv.slice(2))).catch((e) => {
  // TODO: handle http errors
  console.log(chalk.red(`CLI Error: ${e.toString()}\n${e.stack}`))
  if (e.toString().includes("object Object")) {
    console.log(e)
  }
})

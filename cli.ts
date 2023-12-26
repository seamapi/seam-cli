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
import { pollActionAttemptUntilReady } from "./lib/util/poll-action-attempt-until-ready"
import logResponse from "./lib/util/log-response"
import { getApiDefinitions } from "./lib/get-api-definitions"
import commandLineUsage from "command-line-usage"
import { ContextHelpers } from "./lib/types"
import { version } from './package.json';

const sections = [
  {
    header: "Seam CLI",
    content:
      "Every seam command is interactive and will prompt you for any missing required properties with helpful suggestions. To avoid automatic behavior, pass -y ",
  },
  {
    header: "Options",
    optionList: [
      {
        name: "help",
        description: "Display this help guide.",
        alias: "h",
        type: Boolean,
      },
    ],
  },
  {
    header: "Command List Examples",
    content: [
      { name: "seam", summary: "Interactively select commands to execute." },
      { name: "seam login", summary: "Login to Seam." },
      { name: "seam select workspace", summary: "Select your workspace." },
      {
        name: "seam connect-webviews create",
        summary: "Create a connect webview to connect devices.",
      },
      { name: "seam devices list", summary: "List devices in your workspace." },
      {
        name: "seam locks unlock-door {bold --device-id} $MY_DOOR",
        summary: "Unlock a lock.",
      },
      {
        name: "seam access-codes create {bold --code} '1234' {bold --name} 'My Code'",
        summary: "Create an access code.",
      },
      {
        name: "seam access-codes list {bold --device-id} $MY_DOOR",
        summary: "List you access codes.",
      },
    ],
  },
]

async function cli(args: ParsedArgs) {
  const config = getConfigStore()

  if (args.help || args.h) {
    const usage = commandLineUsage(sections)
    console.log(usage)
    return
  }
  
  if (
    !config.get(`${getServer()}.pat`) &&
    args._[0] !== "login" &&
    !isEqual(args._, ["select", "server"])
  ) {
    console.log(`Not logged in. Please run "seam login"`)
    process.exit(1)
  }

  if (args.version) {
    console.log(version)
    process.exit(0)
  }

  args._ = args._.map((arg) => arg.toLowerCase().replace(/_/g, "-"))
  for (const k in args) {
    args[k.toLowerCase().replace(/-/g, "_")] = args[k]
  }

  const api = await getApiDefinitions(args.remote_api_defs)

  const commandParams: Record<string, any> = {}

  const ctx: ContextHelpers = {
    api,
  }

  for (const k in args) {
    if (k === "_") continue
    const v = args[k]
    delete args[k]
    args[k.replace(/-/g, "_")] = v
    commandParams[k.replace(/-/g, "_")] = v
  }

  const selectedCommand = await interactForCommandSelection(args._, ctx)
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

  // TODO - do this using the OpenAPI spec for the command rather than
  // explicitly encoding the property names
  if (commandParams.accepted_providers) {
    commandParams.accepted_providers =
      commandParams.accepted_providers.split(",")
  }

  const params = await interactForCommandParams(
    { command: selectedCommand, params: commandParams },
    ctx
  )
  const seam = await getSeam()

  const apiPath = `/${selectedCommand.join("/").replace(/-/g, "_")}`

  console.log(`\n\n${chalk.green(apiPath)}`)
  console.log(`Request Params:`)
  console.log(params)

  const response = await seam.client.post(apiPath, params, {
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

cli(parseArgs(process.argv.slice(2))).catch((e) => {
  console.log(chalk.red(`CLI Error: ${e.toString()}\n${e.stack}`))
  if (e.toString().includes("object Object")) {
    console.log(e)
  }
})

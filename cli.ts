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
import commandLineUsage from "command-line-usage"

const sections = [
  {
    header: "Seam CLI",
    content:
      "Every seam command is interactive and will prompt you for any missing required properties with helpful suggestions. To avoid automatic behavior, pass -y ",
  },
  {
    header: 'Options',
    optionList: [
      {
        name: 'help',
        description: 'Display this help guide.',
        alias: 'h',
        type: Boolean
      },
    ]
  },
  {
    header: "Command List",
    content: [
      { name: "seam", summary: "Interactively select commands to execute." },
      { name: "seam login", summary: "Login to Seam." },
      { name: "seam select workspace", summary: "Select your workspace." },
      { name: "seam connect-webviews create", summary: "Create a connect webview to connect devices." },
      { name: "seam devices list", summary: "List devices in your workspace." },
      { name: "seam locks unlock-door {bold --device-id} $MY_DOOR", summary: "Unlock a lock." },
      { name: "seam access-codes create {bold --code} '1234' {bold --name} 'My Code'", summary: "Create an access code." },
      { name: "seam access-codes list {bold --device-id} $MY_DOOR", summary: "List you access codes." },
    ],
  },
]

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

  if (args.help || args.h) {
    const usage = commandLineUsage(sections)
    console.log(usage)
    return
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

  if (response.status >= 400) {
    console.log(chalk.red(`\n\n[${response.status}]\n`))
  } else {
    console.log(chalk.green(`\n\n[${response.status}]`))
  }
  console.dir(response.data, { depth: null })
  console.log("\n")
}

cli(parseArgs(process.argv.slice(2))).catch((e) => {
  console.log(chalk.red(`CLI Error: ${e.toString()}\n${e.stack}`))
  if (e.toString().includes("object Object")) {
    console.log(e)
  }
})

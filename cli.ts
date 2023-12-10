#!/usr/bin/env node
import isEqual from "lodash/isEqual"
import { getCommandOpenApiDef } from "./lib/get-command-open-api-def"
import { getConfigStore } from "./lib/get-config-store"
import { interactForCommandParams } from "./lib/interact-for-command-params"
import { interactForCommandSelection } from "./lib/interact-for-command-selection"
import parseArgs, { ParsedArgs } from "minimist"
import { interactForLogin } from "./lib/interact-for-login"
import { interactForWorkspaceId } from "./lib/interact-for-workspace-id"

async function cli(args: ParsedArgs) {
  const config = getConfigStore()

  if (!config.get("pat") && args._[0] !== "login") {
    console.log(`Not logged in. Please run "seam login"`)
    process.exit(1)
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
  }

  const params = await interactForCommandParams(selectedCommand)
}

cli(parseArgs(process.argv.slice(2))).catch((e) => {
  console.log("CLI Error", e.toString())
})

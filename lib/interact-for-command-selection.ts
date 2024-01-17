import prompts from "prompts"
import uniqBy from "lodash/uniqBy"
import isEqual from "lodash/isEqual"
import { ApiDefinitions } from "./get-api-definitions"
import { ContextHelpers } from "./types"

const ergonomicOrder = ["create", "list", "get", "update", "unlock_door"]

function ergonomicSort(aStr: string, bStr: string) {
  let a = ergonomicOrder.indexOf(aStr)
  if (a === -1) a = ergonomicOrder.length
  let b = ergonomicOrder.indexOf(bStr)
  if (b === -1) b = ergonomicOrder.length

  return a > b ? 1 : a < b ? -1 : 0
}

export async function interactForCommandSelection(
  commandPath: string[],
  helpers: ContextHelpers
) {
  const commands = Object.keys(helpers.api.paths!)
    .map((k) => k.replace(/_/g, "-").replace(/^\//, "").split("/"))
    .concat([
      ["login"],
      ["logout"],
      ["config", "reveal-location"],
      ["config", "use-remote-api-defs"],
      ["select", "workspace"],
      ["select", "server"],
    ])

  const possibleCommands = uniqBy(
    commandPath.length === 0
      ? commands
      : commands.filter((cmd) =>
          isEqual(cmd.slice(0, commandPath.length), commandPath)
        ),
    (v) => v[commandPath.length]
  )
  if (possibleCommands.length === 0) {
    throw new Error("No possible commands")
  }

  if (
    possibleCommands.length === 1 &&
    possibleCommands[0].length === commandPath.length
  ) {
    return commandPath
  }
  const commandPathStr = commandPath.join("/").replace(/-/g, "_")

  const res = await prompts({
    name: "Command",
    type: "autocomplete",
    choices: [
      ...possibleCommands.map((cmd) => ({
        title:
          cmd?.[commandPath.length] ?? `[Call /${commandPathStr} Directly]`,
        value: cmd?.[commandPath.length] ?? "<none>",
      })),
    ].sort((a, b) => ergonomicSort(a.value, b.value)),
    message: `Select a command: /${commandPathStr}`,
  })

  if (res?.Command === undefined) {
    throw new Error("Bailed")
  }

  if (res?.Command === "<none>") {
    return commandPath
  }

  const newCommandPath = [...commandPath, res.Command]

  const fullCommand = possibleCommands.find((cmd) =>
    isEqual(newCommandPath, cmd)
  )

  if (!fullCommand) {
    return interactForCommandSelection(newCommandPath, helpers)
  }

  return fullCommand
}

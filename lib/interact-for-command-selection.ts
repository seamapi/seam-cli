import prompts from "prompts"
import { getOpenApi } from "./get-open-api"
import uniqBy from "lodash/uniqBy"
import isEqual from "lodash/isEqual"

const ergonomicOrder = ["create", "list", "get", "update", "unlock_door"]

function ergonomicSort(aStr: string, bStr: string) {
  let a = ergonomicOrder.indexOf(aStr)
  if (a === -1) a = ergonomicOrder.length
  let b = ergonomicOrder.indexOf(bStr)
  if (b === -1) b = ergonomicOrder.length

  return a > b ? 1 : a < b ? -1 : 0
}

export async function interactForCommandSelection(commandPath: string[]) {
  const commands = Object.keys((await getOpenApi()).paths!)
    .map((k) => k.replace(/_/g, "-").replace(/^\//, "").split("/"))
    .concat([
      ["login"],
      ["logout"],
      ["config", "reveal-location"],
      ["select", "workspace"],
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

  const res = await prompts({
    name: "Command",
    type: "autocomplete",
    choices: [
      ...possibleCommands.map((cmd) => ({
        title: cmd[commandPath.length],
        value: cmd[commandPath.length],
      })),
    ].sort((a, b) => ergonomicSort(a.value, b.value)),
    message: `Select a command: ${commandPath.join("/").replace(/-/g, "_")}`,
  })

  if (!res?.Command) {
    throw new Error("Bailed")
  }

  const newCommandPath = [...commandPath, res.Command]

  const fullCommand = possibleCommands.find((cmd) =>
    isEqual(newCommandPath, cmd)
  )

  if (!fullCommand) {
    return interactForCommandSelection(newCommandPath)
  }

  return fullCommand
}

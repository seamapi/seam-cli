import prompts from "prompts"
import { getOpenApi } from "./lib/get-open-api"
import uniqBy from "lodash/uniqBy"
import isEqual from "lodash/isEqual"

const commands = Object.keys(getOpenApi().paths).map((k) =>
  k.replace(/_/g, "-").replace(/^\//, "").split("/")
)

async function recursivelyInteractForCommand(commandPath: string[]) {
  const possibleCommands = uniqBy(
    commandPath.length === 0
      ? commands
      : commands.filter((cmd) =>
          isEqual(cmd.slice(0, commandPath.length), commandPath)
        ),
    (v) => v[commandPath.length]
  )

  if (!possibleCommands) {
    throw new Error("No possible commands")
  }

  const res = await prompts({
    name: "Command",
    type: "autocomplete",
    choices: [
      ...possibleCommands.map((cmd) => ({
        title: cmd[commandPath.length],
        value: cmd[commandPath.length],
      })),
    ],
    message: "Select Command",
  })

  if (!res?.Command) {
    throw new Error("Bailed")
  }

  const newCommandPath = [...commandPath, res.Command]

  const fullCommand = possibleCommands.find((cmd) =>
    isEqual(newCommandPath, cmd)
  )

  if (!fullCommand) {
    return recursivelyInteractForCommand(newCommandPath)
  }

  return fullCommand
}

async function cli() {
  console.log(await recursivelyInteractForCommand([]))
}

cli().catch((e) => {
  console.log("CLI Error", e.toString())
})
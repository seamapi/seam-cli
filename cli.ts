import prompts from "prompts"
import { getOpenApi } from "./lib/get-open-api"
import { deepEquals } from "bun"
import { uniq, uniqBy } from "lodash"

const commands = Object.keys(getOpenApi().paths).map((k) =>
  k.replace(/_/g, "-").replace(/^\//, "").split("/")
)

async function recursivelyInteractForCommand(commandPath: string[]) {
  const openapi = getOpenApi()
  const possibleCommands = uniqBy(
    commandPath.length === 0
      ? commands
      : commands.filter((cmd) =>
          deepEquals(cmd.slice(0, commandPath.length), commandPath)
        ),
    (v) => v[0]
  )
  const res = await prompts({
    name: "Command",
    type: "select",
    choices: [
      ...possibleCommands.map((cmd) => ({
        title: cmd[commandPath.length],
        value: cmd[commandPath.length],
      })),
    ],
    message: "Select Command",
  })

  const newCommandPath = [...commandPath, res.Command]

  const fullCommand = possibleCommands.find((cmd) =>
    deepEquals(newCommandPath, cmd)
  )

  if (!fullCommand) {
    return recursivelyInteractForCommand(newCommandPath)
  }

  return fullCommand
}

async function cli() {
  recursivelyInteractForCommand([])
}

cli()

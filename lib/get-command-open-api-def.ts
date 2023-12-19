import { ApiDefinitions } from "./get-api-definitions"
import { ContextHelpers } from "./types"
export const getCommandOpenApiDef = async (
  cmd: string[],
  helpers: ContextHelpers
) => {
  const path = `/${cmd.join("/").replace(/-/g, "_")}`
  const def = helpers.api.paths![path]
  if (!def) {
    throw new Error(`No definition for path ${path}`)
  }

  return def
}

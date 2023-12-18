import { ApiDefinitions } from "./get-api-definitions"
export const getCommandOpenApiDef = async (
  api: ApiDefinitions,
  cmd: string[]
) => {
  const path = `/${cmd.join("/").replace(/-/g, "_")}`
  const def = api.paths![path]
  if (!def) {
    throw new Error(`No definition for path ${path}`)
  }

  return def
}

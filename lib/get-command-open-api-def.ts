import { getOpenApi } from "./get-open-api"

export const getCommandOpenApiDef = async (cmd: string[]) => {
  const openApi = await getOpenApi()
  const path = `/${cmd.join("/").replace(/-/g, "_")}`
  const def = openApi.paths![path]
  if (!def) {
    throw new Error(`No definition for path ${path}`)
  }

  return def
}

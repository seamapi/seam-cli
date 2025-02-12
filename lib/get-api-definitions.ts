import { getOpenapiSchema } from "@seamapi/http/connect"
import { openapi } from "@seamapi/types/connect"
import { type OpenAPI } from "openapi-types"
import SwaggerParser from "swagger-parser"
import { getServer } from "./get-server"

export type ApiDefinitions = Awaited<ReturnType<SwaggerParser["dereference"]>>

export const getApiDefinitions = async (
  useRemoteDefinitions: boolean
): Promise<ApiDefinitions> => {
  const schema = await getSchema(useRemoteDefinitions)
  const filteredSchema = filterSchemaPaths(schema)

  return SwaggerParser.dereference(
    filteredSchema as unknown as OpenAPI.Document
  )
}

const getSchema = async (
  useRemoteDefinitions: boolean
): Promise<typeof openapi> => {
  if (!useRemoteDefinitions) return openapi
  const endpoint = getServer()
  return getOpenapiSchema(endpoint)
}

function filterSchemaPaths(schema: typeof openapi): typeof openapi {
  const filteredPaths = Object.fromEntries(
    Object.entries(schema.paths).filter(([path, pathSchema]) => {
      if (path.startsWith("/seam")) return false

      const isPathUndocumented =
        pathSchema.post && (pathSchema.post as any)?.["x-undocumented"] != null
      if (isPathUndocumented) return false

      return true
    })
  )
  return { ...schema, paths: filteredPaths } as typeof openapi
}

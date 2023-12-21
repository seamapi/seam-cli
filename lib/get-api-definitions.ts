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
  return SwaggerParser.dereference(schema as unknown as OpenAPI.Document)
}

const getSchema = async (useRemoteDefinitions: boolean): typeof openapi => {
  if (!useRemoteDefinitions) return openapi
  const endpoint = getServer()
  return getOpenapiSchema(endpoint)
}

import { getOpenapiSchema } from "@seamapi/http/connect"
import { openapi } from "@seamapi/types/connect"
import { type OpenAPI } from "openapi-types"
import SwaggerParser from "swagger-parser"

export type ApiDefinitions = Awaited<ReturnType<SwaggerParser["dereference"]>>

export const getApiDefinitions = async (
  useRemoteDefinitions: boolean
): Promise<ApiDefinitions> => {
  const schema = useRemoteDefinitions ? await getOpenapiSchema() : openapi
  return SwaggerParser.dereference(schema as unknown as OpenAPI.Document)
}

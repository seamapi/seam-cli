import seamOpenApi from "./openapi.json"
import SwaggerParser from "swagger-parser"

export const getOpenApi = async () => {
  return SwaggerParser.dereference(seamOpenApi as any)
}

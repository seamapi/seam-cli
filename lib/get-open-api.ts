import type { OpenApi } from "openapi-v3"
import seamOpenApi from "./openapi.json"

export const getOpenApi = (): OpenApi => {
  return seamOpenApi as any
}

import localApi from "./openapi.json"
import SwaggerParser from "swagger-parser"
import axios from "redaxios"
import { getServer } from "./get-server"

export type ApiDefinitions = Awaited<ReturnType<SwaggerParser["dereference"]>>

export const getApiDefinitions = async (
  useRemoteDefinitions: boolean
): Promise<ApiDefinitions> => {
  if (useRemoteDefinitions) {
    const { data: remoteApi } = await axios.get(`${getServer()}/openapi.json`)
    return SwaggerParser.dereference(remoteApi as any)
  }

  return SwaggerParser.dereference(localApi as any)
}

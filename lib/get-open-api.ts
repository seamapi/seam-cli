import localApi from "./openapi.json"
import SwaggerParser from "swagger-parser"
import axios from "redaxios"

export type ApiDefinitions = Awaited<ReturnType<SwaggerParser["dereference"]>>

export const getApiDefinitions = async (
  useRemoteDefinitions: boolean
): Promise<ApiDefinitions> => {
  if (useRemoteDefinitions) {
    const { data: remoteApi } = await axios.get(
      "https://connect.getseam.com/openapi.json"
    )
    return SwaggerParser.dereference(remoteApi as any)
  }

  return SwaggerParser.dereference(localApi as any)
}

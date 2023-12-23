import prompts from "prompts"
import { getCommandOpenApiDef } from "./get-command-open-api-def"
import { OpenApiSchema } from "openapi-v3"
import { interactForDevice } from "./interact-for-device"
import { interactForAccessCode } from "./interact-for-access-code"
import { interactForConnectedAccount } from "./interact-for-connected-account"
import { flattenObjSchema } from "./openapi/flatten-obj-schema"
import { interactForTimestamp } from "./interact-for-timestamp"
import { interactForUserIdentity } from "./interact-for-user-identity"
import { interactForAcsSystem } from "./interact-for-acs-system"
import { interactForAcsUser } from "./interact-for-acs-user"
import { interactForCredentialPool } from "./interact-for-credential-pool"
import { ContextHelpers } from "./types"
import { interactForAcsEntrance } from "./interact-for-acs-entrance"
import { interactForOpenApiObject } from "./interact-for-open-api-object"

const ergonomicPropOrder = [
  "name",
  "connected_account_id",
  "device_id",
  "access_code_id",
  "code",
]

export const interactForCommandParams = async (
  args: {
    command: string[]
    params: Record<string, any>
  },
  ctx: ContextHelpers
): Promise<any> => {
  const { command, params: currentParams } = args
  const requestBody = ((await getCommandOpenApiDef(command, ctx)).post as any)
    ?.requestBody

  if (!requestBody) return ""

  if ("$ref" in requestBody) {
    throw new Error(
      "Issue parsing OpenAPI https://github.com/seamapi/experimental-seam-cli/issues/1"
    )
  }

  if (!("content" in requestBody)) throw new Error("No content in requestBody")

  const requestSchema = (requestBody as any).content["application/json"].schema

  return interactForOpenApiObject(
    {
      command: args.command,
      params: args.params,
      schema: requestSchema,
    },
    ctx
  )
}

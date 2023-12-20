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

const ergonomicPropOrder = [
  "name",
  "connected_account_id",
  "device_id",
  "access_code_id",
  "code",
]

export const interactForCommandParams = async (
  cmd: string[],
  currentParams: ContextHelpers & Record<string, any>
): Promise<any> => {
  const requestBody = (
    (await getCommandOpenApiDef(cmd, currentParams)).post as any
  )?.requestBody

  if (!requestBody) return ""

  if ("$ref" in requestBody) {
    throw new Error(
      "Issue parsing OpenAPI https://github.com/seamapi/experimental-seam-cli/issues/1"
    )
  }

  if (!("content" in requestBody)) throw new Error("No content in requestBody")

  const schema: OpenApiSchema = flattenObjSchema(
    (requestBody as any).content["application/json"].schema
  )

  const { properties = {}, required = [] } = schema

  const haveAllRequiredParams = required.every((k) => currentParams[k])

  const propSortScore = (prop: string) => {
    if (required.includes(prop)) return 100
    if (currentParams[prop] !== undefined)
      return 50 - Object.keys(currentParams).indexOf(prop)
    return ergonomicPropOrder.indexOf(prop)
  }

  const cmdPath = `/${cmd.join("/").replace(/-/g, "_")}`
  console.log("")
  const { paramToEdit } = await prompts({
    name: "paramToEdit",
    message: `[${cmdPath}] Parameters`,
    type: "autocomplete",
    choices: [
      ...(haveAllRequiredParams
        ? [
            {
              value: "done",
              title: `[Make API Call] ${cmdPath}`,
            },
          ]
        : []),
      ...Object.keys(properties)
        .map((k) => {
          let propDesc = (properties[k] as any)?.description ?? ""
          return {
            title: k + (required.includes(k) ? "*" : ""),
            value: k,
            description:
              currentParams[k] !== undefined
                ? `[${currentParams[k]}] ${propDesc}`
                : propDesc,
          }
        })
        .sort((a, b) => propSortScore(b.value) - propSortScore(a.value)),
    ],
  })

  if (paramToEdit === "done") {
    // TODO check for required
    return currentParams
  }

  const prop = properties[paramToEdit]

  if (paramToEdit === "device_id") {
    const device_id = await interactForDevice()
    return interactForCommandParams(cmd, { ...currentParams, device_id })
  } else if (paramToEdit === "access_code_id") {
    const access_code_id = await interactForAccessCode(currentParams as any)
    return interactForCommandParams(cmd, {
      ...currentParams,
      access_code_id,
    })
  } else if (paramToEdit === "connected_account_id") {
    const connected_account_id = await interactForConnectedAccount()
    return interactForCommandParams(cmd, {
      ...currentParams,
      connected_account_id,
    })
  } else if (paramToEdit === "user_identity_id") {
    const user_identity_id = await interactForUserIdentity()
    return interactForCommandParams(cmd, {
      ...currentParams,
      user_identity_id,
    })
  } else if (paramToEdit.endsWith("acs_system_id")) {
    const acs_system_id = await interactForAcsSystem()
    return interactForCommandParams(cmd, {
      ...currentParams,
      [paramToEdit]: acs_system_id,
    })
  } else if (paramToEdit.endsWith("credential_pool_id")) {
    const credential_pool_id = await interactForCredentialPool()
    return interactForCommandParams(cmd, {
      ...currentParams,
      [paramToEdit]: credential_pool_id,
    })
  } else if (paramToEdit.endsWith("acs_user_id")) {
    const acs_user_id = await interactForAcsUser()
    return interactForCommandParams(cmd, {
      ...currentParams,
      [paramToEdit]: acs_user_id,
    })
  } else if (
    // TODO replace when openapi returns if a field is a timestamp
    paramToEdit.endsWith("_at") ||
    paramToEdit === "since" ||
    paramToEdit.endsWith("_before") ||
    paramToEdit.endsWith("_after")
  ) {
    const tsval = await interactForTimestamp()
    return interactForCommandParams(cmd, {
      ...currentParams,
      [paramToEdit]: tsval,
    })
  }

  if ("type" in prop) {
    if (prop.type === "string") {
      let value
      if (prop.enum) {
        value = (
          await prompts({
            name: "value",
            message: `${paramToEdit}:`,
            type: "select",
            choices: prop.enum.map((v) => ({
              title: v.toString(),
              value: v.toString(),
            })),
          })
        ).value
      } else {
        value = (
          await prompts({
            name: "value",
            message: `${paramToEdit}:`,
            type: "text",
          })
        ).value
      }
      return interactForCommandParams(cmd, {
        ...currentParams,
        [paramToEdit]: value,
      })
    } else if (prop.type === "boolean") {
      const { value } = await prompts({
        name: "value",
        message: `${paramToEdit}:`,
        type: "toggle",
        initial: true,
      })

      return interactForCommandParams(cmd, {
        ...currentParams,
        [paramToEdit]: value,
      })
    } else if (prop.type === "array") {
      const value = (
        await prompts({
          name: "value",
          message: `${paramToEdit}:`,
          type: "multiselect",
          choices: (prop as any).items.enum.map((v: string) => ({
            title: v.toString(),
            value: v.toString(),
          })),
        })
      ).value
      return interactForCommandParams(cmd, {
        ...currentParams,
        [paramToEdit]: value,
      })
    }
  }

  throw new Error(
    `Didn't know how to handle OpenAPI schema for property: "${paramToEdit}"`
  )
}

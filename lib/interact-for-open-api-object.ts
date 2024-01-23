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
import { ellipsis } from "./util/ellipsis"
import { interactForArray } from "./interact-for-array"
import { interactForCustomMetadata } from "./interact-for-custom-metadata"

const ergonomicPropOrder = [
  "name",
  "connected_account_id",
  "device_id",
  "access_code_id",
  "user_identity_id",
  "code",
  "starts_at",
  "ends_at",
]

export const interactForOpenApiObject = async (
  args: {
    command: string[]
    schema: OpenApiSchema
    params: Record<string, any>
    isSubProperty?: boolean
    subPropertyPath?: string
  },
  ctx: ContextHelpers
): Promise<any> => {
  // Clone args and args params so that we can mutate it
  args = { ...args, params: { ...args.params } }

  const schema: OpenApiSchema = flattenObjSchema(args.schema)

  const { properties = {}, required = [] } = schema

  const haveAllRequiredParams = required.every((k) => args.params[k])

  const propSortScore = (prop: string) => {
    if (required.includes(prop)) return 100 - ergonomicPropOrder.indexOf(prop)
    if (args.params[prop] !== undefined)
      return 50 - Object.keys(args.params).indexOf(prop)
    return ergonomicPropOrder.indexOf(prop)
  }

  const cmdPath = `/${args.command.join("/").replace(/-/g, "_")}`
  const parameterSelectionMessage = args.isSubProperty
    ? `Editing "${args.subPropertyPath}"`
    : `[${cmdPath}] Parameters`

  console.log("")
  const { paramToEdit } = await prompts({
    name: "paramToEdit",
    message: parameterSelectionMessage,
    type: "autocomplete",
    choices: [
      ...(haveAllRequiredParams && !args.isSubProperty
        ? [
            {
              value: "done",
              title: `[Make API Call] ${cmdPath}`,
            },
          ]
        : []),
      ...(haveAllRequiredParams && args.isSubProperty
        ? [
            {
              title: `[Save]`,
              value: "done",
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
              args.params[k] !== undefined
                ? typeof args.params[k] === "object"
                  ? `${ellipsis(
                      JSON.stringify(args.params[k]),
                      60
                    )} ${propDesc}`
                  : `[${args.params[k]}] ${propDesc}`
                : propDesc,
          }
        })
        .sort((a, b) => propSortScore(b.value) - propSortScore(a.value)),
      ...(args.isSubProperty
        ? [
            {
              title: `[Leave Empty]`,
              value: "empty",
            },
          ]
        : []),
    ],
  })

  if (paramToEdit === "empty") {
    return undefined
  }

  if (paramToEdit === "done") {
    // TODO check for required
    return args.params
  }

  const prop = properties[paramToEdit]

  if (paramToEdit === "device_id") {
    args.params[paramToEdit] = await interactForDevice()
    return interactForOpenApiObject(args, ctx)
  } else if (paramToEdit === "access_code_id") {
    args.params[paramToEdit] = await interactForAccessCode(args.params as any)
    return interactForOpenApiObject(args, ctx)
  } else if (paramToEdit === "connected_account_id") {
    const connected_account_id = await interactForConnectedAccount()
    args.params[paramToEdit] = connected_account_id
    return interactForOpenApiObject(args, ctx)
  } else if (
    paramToEdit === "user_identity_id" ||
    paramToEdit === "user_identity_ids"
  ) {
    const user_identity_id = await interactForUserIdentity()
    args.params[paramToEdit] =
      paramToEdit === "user_identity_ids"
        ? [user_identity_id]
        : user_identity_id
    return interactForOpenApiObject(args, ctx)
  } else if (paramToEdit.endsWith("acs_system_id")) {
    args.params[paramToEdit] = await interactForAcsSystem()
    return interactForOpenApiObject(args, ctx)
  } else if (paramToEdit.endsWith("credential_pool_id")) {
    args.params[paramToEdit] = await interactForCredentialPool()
    return interactForOpenApiObject(args, ctx)
  } else if (paramToEdit.endsWith("acs_user_id")) {
    args.params[paramToEdit] = await interactForAcsUser()
    return interactForOpenApiObject(args, ctx)
  } else if (paramToEdit.endsWith("acs_entrance_id")) {
    args.params.acs_entrance_id = await interactForAcsEntrance()
    return interactForOpenApiObject(args, ctx)
  } else if (
    // TODO replace when openapi returns if a field is a timestamp
    paramToEdit.endsWith("_at") ||
    paramToEdit === "since" ||
    paramToEdit.endsWith("_before") ||
    paramToEdit.endsWith("_after")
  ) {
    args.params[paramToEdit] = await interactForTimestamp()
    return interactForOpenApiObject(args, ctx)
  } else if (
    paramToEdit === "custom_metadata"
) {
  args.params[paramToEdit] = await interactForCustomMetadata( args.params[paramToEdit] || {})
  return interactForOpenApiObject(args, ctx)
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
      args.params[paramToEdit] = value
      return interactForOpenApiObject(args, ctx)
    } else if (prop.type === "boolean") {
      const { value } = await prompts({
        name: "value",
        message: `${paramToEdit}:`,
        type: "toggle",
        initial: true,
        active: "true",
        inactive: "false",
      })

      args.params[paramToEdit] = value

      return interactForOpenApiObject(args, ctx)
    } else if (prop.type === "array" && (prop as any)?.items?.enum) {
      const value = (
        await prompts({
          name: "value",
          message: `${paramToEdit}:`,
          type: "autocompleteMultiselect",
          choices: (prop as any).items.enum.map((v: string) => ({
            title: v.toString(),
            value: v.toString(),
          })),
        })
      ).value
      args.params[paramToEdit] = value
      return interactForOpenApiObject(args, ctx)
    } else if (prop.type === "array") {
      args.params[paramToEdit] = await interactForArray(
        args.params[paramToEdit] || [],
        `Edit the list for ${paramToEdit}`
      )
      return interactForOpenApiObject(args, ctx)
    } else if (prop.type === "object") {
      args.params[paramToEdit] = await interactForOpenApiObject(
        {
          command: args.command,
          params: {},
          schema: prop,
          isSubProperty: true,
          subPropertyPath: paramToEdit,
        },
        ctx
      )
      return interactForOpenApiObject(args, ctx)
    }
  }

  throw new Error(
    `Didn't know how to handle OpenAPI schema for property: "${paramToEdit}"`
  )
}

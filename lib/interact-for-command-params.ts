import prompts from "prompts"
import { getCommandOpenApiDef } from "./get-command-open-api-def"
import { OpenApiSchema } from "openapi-v3"

const ergonomicPropOrder = [
  "name",
  "connected_account_id",
  "device_id",
  "access_code_id",
  "code",
]

export const interactForCommandParams = async (
  cmd: string[],
  currentParams: any = {}
) => {
  const requestBody = ((await getCommandOpenApiDef(cmd)).post as any)
    ?.requestBody

  if ("$ref" in requestBody) {
    throw new Error(
      "Issue parsing OpenAPI https://github.com/seamapi/experimental-seam-cli/issues/1"
    )
  }

  if (!("content" in requestBody)) throw new Error("No content in requestBody")

  const schema: OpenApiSchema = (requestBody as any).content["application/json"]
    .schema

  const { properties = {}, required = [] } = schema

  const propSortScore = (prop: string) => {
    if (required.includes(prop)) return 100
    return ergonomicPropOrder.indexOf(prop)
  }

  const cmdPath = `/${cmd.join("/").replace(/-/g, "_")}`

  const { paramToEdit } = await prompts({
    name: "paramToEdit",
    message: `${cmdPath}`,
    type: "autocomplete",
    choices: [
      {
        value: "done",
        title: `Call ${cmdPath}`,
        description: JSON.stringify(currentParams),
      },
    ].concat(
      Object.keys(properties)
        .map((k) => {
          let propDesc = (properties[k] as any)?.description ?? ""
          return {
            title: k + (required.includes(k) ? "*" : ""),
            value: k,
            description: currentParams[k]
              ? `[${currentParams[k]}] ${propDesc}`
              : propDesc,
          }
        })
        .sort((a, b) => propSortScore(b.value) - propSortScore(a.value))
    ),
  })

  if (paramToEdit === "done") {
    return currentParams
  }

  const prop = properties[paramToEdit]

  console.log(prop)
}

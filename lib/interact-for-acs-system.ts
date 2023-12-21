import prompts from "prompts"
import { getSeam } from "./get-seam"

export const interactForAcsSystem = async (message?: string) => {
  const seam = await getSeam()

  const systems = await seam.acs.systems.list()

  const { acsSystemId } = await prompts({
    name: "acsSystemId",
    type: "autocomplete",
    message: message ?? "Select an ACS System:",
    choices: systems.map((sys) => ({
      title: `${sys.name} ${sys.external_type_display_name}`,
      value: sys.acs_system_id,
      description: sys.acs_system_id,
    })),
  })

  return acsSystemId
}

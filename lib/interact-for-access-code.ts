import prompts from "prompts"
import { getSeam } from "./get-seam"
import { interactForDevice } from "./interact-for-device"

export const interactForAccessCode = async ({
  device_id,
}: {
  device_id?: string
}) => {
  const seam = await getSeam()

  if (!device_id) {
    device_id = await interactForDevice()
  }

  const accessCodes = await seam.accessCodes.list({
    device_id,
  })

  const { accessCodeId } = await prompts({
    name: "accessCodeId",
    type: "autocomplete",
    message: "Select an access_code:",
    choices: accessCodes.map((ac: any) => ({
      title: ac?.properties?.name ?? "<No Name>",
      value: ac?.access_code_id,
      description: `${ac?.type} ${ac?.access_code_id}`,
    })),
  })

  return accessCodeId
}

import prompts from "prompts"
import { getSeam } from "./get-seam"
import { getConfigStore } from "./get-config-store"
export const interactForDevice = async () => {
  const seam = await getSeam()

  const devices = await seam.devices.list()

  const { deviceId } = await prompts({
    name: "deviceId",
    type: "autocomplete",
    message: "Select a device:",
    choices: devices.map((device: any) => ({
      title: device.properties.name ?? "<No Name>",
      value: device.device_id,
      description: `${device.device_type} ${device.device_id}`,
    })),
  })

  return deviceId
}

import prompts from "prompts"
import { getSeam } from "./get-seam"

export const interactForUserIdentity = async () => {
  const seam = await getSeam()

  const uis = await seam.userIdentities.list()

  const { userIdentityId } = await prompts({
    name: "userIdentityId",
    type: "autocomplete",
    message: "Select a user_identity:",
    choices: uis.map((ui) => ({
      title: `${ui.email_address} "${ui.full_name}: ${ui.user_identity_key}`,
      value: ui.user_identity_id,
      description: ui.user_identity_id,
    })),
  })

  return userIdentityId
}

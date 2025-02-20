import prompts from "prompts"
import { getSeam } from "./get-seam"
import { interactForAcsSystem } from "./interact-for-acs-system"
import { withLoading } from "./util/with-loading"

export const interactForAcsUser = async () => {
  const seam = await getSeam()

  const acs_system_id = await interactForAcsSystem(
    "What acs_system does the acs_user belong to?"
  )

  const users = await withLoading("Fetching ACS users...", () =>
    seam.acs.users.list({
      acs_system_id,
    })
  )
  const { acsUserId } = await prompts({
    name: "acsUserId",
    type: "autocomplete",
    message: "Select an acs_user:",
    choices: users.map((user) => ({
      title: `${user.display_name} ${user.email_address}`,
      value: user.acs_user_id,
      description: user.acs_user_id,
    })),
  })

  return acsUserId
}

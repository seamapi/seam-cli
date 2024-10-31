import prompts from "prompts"
import { getSeam } from "./get-seam"
import { interactForAcsSystem } from "./interact-for-acs-system"
import { withLoading } from "./util/with-loading"

export const interactForCredentialPool = async () => {
  const seam = await getSeam()

  const acs_system_id = await interactForAcsSystem(
    "What acs_system does the credential pool belong to?"
  )

  const credentialPools = await withLoading(
    "Fetching ACS credential pools...",
    () =>
      seam.acs.credentialPools.list({
        acs_system_id,
      })
  )

  const { credentialPoolId } = await prompts({
    name: "credentialPoolId",
    type: "autocomplete",
    message: "Select a acs_credential_pool:",
    choices: credentialPools.map((cp) => ({
      title: `${cp.display_name} ${cp.external_type_display_name}`,
      value: cp.acs_credential_pool_id,
      description: cp.acs_credential_pool_id,
    })),
  })

  return credentialPoolId
}

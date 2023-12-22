import prompts from "prompts"
import { getSeam } from "./get-seam"
import { interactForAcsSystem } from "./interact-for-acs-system"

export const interactForCredentialPool = async () => {
  const seam = await getSeam()

  const acs_system_id = await interactForAcsSystem(
    "What acs_system does the credential pool belong to?"
  )

  const credentialPools = await seam.acs.credentialPools.list({
    acs_system_id,
  })

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

import prompts from "prompts"
import { getConfigStore } from "./get-config-store"
import { getCurrentWorkspaceId } from "./get-current-workspace-id"
import { getServer } from "./get-server"

export const interactForLogin = async () => {
  const config = await getConfigStore()
  console.log(
    `To login, navigate to the URL below and create a new Personal Access Token (PAT) and paste the PAT in the provided box:\n\nhttps://console.seam.co/settings/access-tokens\n\n`
  )

  const { pat } = await prompts({
    name: "pat",
    type: "text",
    message: "Personal Access Token:",
  })

  if (!pat) {
    throw new Error("No PAT provided")
  }

  config.set(`${getServer()}.pat`, pat)

  console.log(`PAT saved! You may begin using the CLI!`)

  await getCurrentWorkspaceId()
}

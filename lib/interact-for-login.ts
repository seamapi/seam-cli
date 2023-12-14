import prompts from "prompts"
import { getConfigStore } from "./get-config-store"
import { getCurrentWorkspaceId } from "./get-current-workspace-id"
import { getServer } from "./get-server"
import chalk from "chalk"

export const interactForLogin = async () => {
  const config = await getConfigStore()

  if (getServer().includes("localhost")) {
    console.log(
      `You're using a local Seam Connect instance, you can enter the API Key to your local user, you can create a new user from:\n\n${getServer()}/admin/create_user_with_api_key`
    )
  } else {
    console.log(
      `To login, navigate to the URL below and create a new Personal Access Token (PAT) and paste the PAT in the provided box:\n\nhttps://console.seam.co/settings/access-tokens\n\n`
    )
  }

  console.log(
    chalk.gray(
      "> Note: You can enter an API Key here for single-workspace access"
    )
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

  console.log(`PAT saved! You may not begin using the CLI!`)

  await getCurrentWorkspaceId()
}

import prompts from "prompts"
import { getConfigStore } from "./get-config-store"
import { randomBytes } from "node:crypto"
import { getServer } from "./get-server"

export async function interactForServerSelection() {
  const randomstring = randomBytes(5).toString("hex")
  const servers = [
    "http://localhost:3020",
    "https://connect.getseam.com",
    `https://${randomstring}.fakeseamconnect.seam.vc`,
  ]

  const { server } = await prompts([
    {
      type: "select",
      name: "server",
      message: "Select a server:",
      choices: servers.map((server) => ({ title: server, value: server })),
    },
  ])

  const config = getConfigStore()
  if (server === servers[2]) {
    config.set(`${getServer()}.pat`, `seam_apikey1_token`)
    console.log(`PAT set to use fakeseamconnect with "seam_apikey1_token"`)
  } else {
    config.set("server", server)
    config.delete("current_workspace_id")
    console.log(`Server set to ${server}`)
  }
}

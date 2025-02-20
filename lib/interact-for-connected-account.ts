import prompts from "prompts"
import { getSeam } from "./get-seam"
import { getConfigStore } from "./get-config-store"
import { withLoading } from "./util/with-loading"
export const interactForConnectedAccount = async () => {
  const seam = await getSeam()

  const connected_accounts = await withLoading(
    "Fetching connected accounts...",
    () => seam.connectedAccounts.list()
  )
  const { connectedAccountId } = await prompts({
    name: "connectedAccountId",
    type: "autocomplete",
    message: "Select a connected_account:",
    choices: connected_accounts.map((connected_account: any) => ({
      title:
        connected_account.user_identifier?.email ??
        connected_account.user_identifier[
          Object.keys(connected_account.user_identifier)[0]
        ],
      value: connected_account.connected_account_id,
      description: `${connected_account.account_type} ${connected_account.connected_account_id}`,
    })),
  })

  return connectedAccountId
}

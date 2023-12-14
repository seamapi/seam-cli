import ms from "ms"
import { getSeam } from "./get-seam"

export const pollActionAttemptUntilReady = async (
  action_attempt_id: string
) => {
  const seam = getSeam()
  const start_time = Date.now()

  let action_attempt
  while (Date.now() < start_time + ms("10s")) {
    action_attempt = await seam.client.get("/action_attempts/get", {
      params: { action_attempt_id },
    })

    if (action_attempt.data.action_attempt.status !== "pending") {
      break
    }

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  return action_attempt?.data.action_attempt
}

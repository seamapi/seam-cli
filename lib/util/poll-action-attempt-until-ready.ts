import ms from "ms"
import { AxiosResponse } from "axios"
import { getSeam } from "../get-seam"
import logResponse from "./log-response"

export const pollActionAttemptUntilReady = async (
  action_attempt_id: string
) => {
  const seam = getSeam()
  const start_time = Date.now()

  let action_attempt
  while (Date.now() < start_time + ms("10s")) {
    action_attempt = await seam.client.get("/action_attempts/get", {
      params: { action_attempt_id },
      validateStatus: () => true,
    })

    if (action_attempt.data.action_attempt.status !== "pending") {
      break
    }

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  logResponse(action_attempt as AxiosResponse)

  return action_attempt?.data.action_attempt
}

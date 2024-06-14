import type { AxiosResponse } from "axios"
import chalk from "chalk"
import { getSeam } from "../get-seam"

export const makeSeamApiRequest = async ({
  path,
  params,
}: {
  path: string
  params: Record<string, any>
}) => {
  const seam = await getSeam()

  logRequest(path, params)

  const response = await seam.client.post(path, params, {
    validateStatus: () => true,
  })

  logResponse(response)

  return response
}

const logResponse = (response: AxiosResponse) => {
  if (response.status >= 400) {
    console.log(chalk.red(`\n\n[${response.status}]\n`))
  } else {
    console.log(chalk.green(`\n\n[${response.status}]`))
  }
  console.dir(response.data, { depth: null })
  console.log("\n")
}

const logRequest = (apiPath: string, params: Record<string, any>) => {
  console.log(`\n\n${chalk.green(apiPath)}`)
  console.log(`Request Params:`)
  console.log(params)
}

export default makeSeamApiRequest

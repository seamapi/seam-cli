import { AxiosResponse } from "axios"
import chalk from "chalk"

export const logResponse = (response: AxiosResponse) => {
  if (response.status >= 400) {
    console.log(chalk.red(`\n\n[${response.status}]\n`))
  } else {
    console.log(chalk.green(`\n\n[${response.status}]`))
  }
  console.dir(response.data, { depth: null })
  console.log("\n")
}

export default logResponse

import ora from "ora"

export const withLoading = async <T>(
  message: string,
  fn: () => Promise<T>
): Promise<T> => {
  const spinner = ora(message).start()
  try {
    const result = await fn()
    spinner.succeed()
    return result
  } catch (error) {
    spinner.fail()
    throw error
  }
}

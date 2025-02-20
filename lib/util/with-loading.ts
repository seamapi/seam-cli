import { createSpinner } from "nanospinner"

export const withLoading = async <T>(
  message: string,
  fn: () => Promise<T>
): Promise<T> => {
  const spinner = createSpinner(message).start()
  try {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    const result = await fn()
    spinner.success()
    return result
  } catch (error) {
    spinner.error()
    throw error
  }
}

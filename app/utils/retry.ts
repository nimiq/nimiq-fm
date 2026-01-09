export async function retry<T>(
  func: () => T | Promise<T>,
  options?: Partial<{
    baseDelay: number
    maxRetries: number
  }>,
): Promise<T> {
  const defaults = {
    baseDelay: 500,
    maxRetries: 10,
  }

  const { baseDelay, maxRetries } = { ...defaults, ...options }

  let i = 0
  while (true) {
    try {
      return await func()
    }
    catch (e) {
      if (i >= maxRetries)
        throw e
      i += 1
      const delay = baseDelay * i // Exponential: 500ms, 1s, 1.5s, 2s...
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

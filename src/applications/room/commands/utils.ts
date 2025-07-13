import { ConflictResourceError } from '../../../domain/shared/error'

/**
 * A higher-order function that wraps a "read-modify-write" operation
 * with optimistic locking retry logic.
 *
 * @param operation The function to execute. It should perform the find, modify, and save sequence.
 * @param options Configuration for the number of retries and delay.
 * @returns A function that, when called, will execute the operation with the retry logic.
 */
export async function retryWithOptimisticLocking<T>(
  operation: () => Promise<T>,
  options: { retries?: number; delay?: number } = {},
): Promise<T> {
  const { retries = 3, delay = 50 } = options
  let lastError: Error | null = null

  for (let i = 0; i < retries; i++) {
    try {
      return await operation()
    } catch (error) {
      // If the error is a conflict, we'll retry. Otherwise, we re-throw immediately.
      if (error instanceof ConflictResourceError) {
        lastError = error
        // If this was the last attempt, we break the loop to throw the final error.
        if (i === retries - 1) {
          break
        }
        const jitter = Math.random() * 50
        await new Promise((res) => setTimeout(res, delay + jitter))
      } else {
        throw error
      }
    }
  }

  // If the loop completes without success, throw the last captured conflict error.
  console.error(`Operation failed after ${retries} attempts.`)
  throw new Error(
    `Failed to apply action due to high contention: ${lastError?.message}`,
  )
}

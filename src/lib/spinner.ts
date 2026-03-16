import pc from 'picocolors'
import type { GlobalOpts } from './config.js'
import type { ApiResponse } from './client.js'
import { isInteractive } from './tty.js'
import { shouldOutputJson } from './output.js'

const BRAILLE_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const FRAME_INTERVAL_MS = 80

interface SpinnerMessages {
  loading: string
  success: string
  fail: string
}

function parseRetryAfter(headers: Headers): number | null {
  const retryAfter = headers.get('retry-after')
  if (!retryAfter) return null
  const parsed = parseInt(retryAfter, 10)
  return isNaN(parsed) ? null : parsed
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wraps an async function with a braille spinner on stderr.
 * Only shows spinner if running in an interactive terminal.
 * Retries on rate limit (429) up to 3 times with exponential backoff.
 *
 * Returns the data from the API response, or exits with API_ERROR on failure.
 */
export async function withSpinner<T>(
  messages: SpinnerMessages,
  fn: () => Promise<ApiResponse<T>>,
  opts: GlobalOpts
): Promise<T> {
  const quiet = shouldOutputJson(opts)
  const interactive = isInteractive() && !quiet

  let frameIndex = 0
  let timer: ReturnType<typeof setInterval> | undefined

  if (interactive) {
    process.stderr.write(`${BRAILLE_FRAMES[0]} ${messages.loading}`)
    timer = setInterval(() => {
      frameIndex = (frameIndex + 1) % BRAILLE_FRAMES.length
      process.stderr.write(`\r${BRAILLE_FRAMES[frameIndex]} ${messages.loading}`)
    }, FRAME_INTERVAL_MS)
  }

  const BACKOFF_DELAYS = [1, 2, 4]

  for (let attempt = 0; attempt <= 3; attempt++) {
    const result = await fn()

    if (result.error) {
      // Check for rate limit
      if (attempt < 3 && result.status === 429) {
        const delay = parseRetryAfter(result.headers) ?? BACKOFF_DELAYS[attempt] ?? 4
        if (interactive) {
          process.stderr.write(`\r${BRAILLE_FRAMES[frameIndex]} Rate limited, retrying in ${delay}s...`)
        }
        await sleep(delay * 1000)
        continue
      }

      // Non-retryable error
      if (timer) clearInterval(timer)
      if (interactive) {
        process.stderr.write(`\r${pc.red('✗')} ${messages.fail}\n`)
      }

      return Promise.reject(result.error)
    }

    // Success
    if (timer) clearInterval(timer)
    if (interactive) {
      process.stderr.write(`\r${pc.green('✓')} ${messages.success}\n`)
    }

    return result.data as T
  }

  // Should not reach here
  if (timer) clearInterval(timer)
  return Promise.reject({ code: 'UNKNOWN', message: 'Unexpected error in withSpinner' })
}

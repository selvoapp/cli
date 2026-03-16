import { resolveApiKey, resolveBaseUrl } from './config.js'
import type { GlobalOpts } from './config.js'
import { USER_AGENT } from './constants.js'
import { ExitCode } from './output.js'

export interface ApiResponse<T = unknown> {
  data: T | null
  error: { code: string; message: string } | null
  status: number
  headers: Headers
}

export interface Client {
  request<T = unknown>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    opts?: { body?: unknown; params?: Record<string, string> }
  ): Promise<ApiResponse<T>>
}

/**
 * Creates an authenticated HTTP client for the Selvo REST API.
 * Exits with code 2 if no API key can be resolved.
 */
export function createClient(opts: GlobalOpts): Client {
  const apiKey = resolveApiKey(opts)
  if (!apiKey) {
    process.stderr.write(
      'Error: No API key found. Run `selvo login` or set SELVO_API_KEY.\n'
    )
    process.exit(ExitCode.AUTH_ERROR)
  }

  const baseUrl = resolveBaseUrl(opts)

  return {
    async request<T>(
      method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
      path: string,
      reqOpts?: { body?: unknown; params?: Record<string, string> }
    ): Promise<ApiResponse<T>> {
      let url = `${baseUrl}/api/v1${path}`

      if (reqOpts?.params && Object.keys(reqOpts.params).length > 0) {
        const qs = new URLSearchParams(reqOpts.params)
        url = `${url}?${qs.toString()}`
      }

      try {
        const res = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT,
          },
          body: reqOpts?.body !== undefined ? JSON.stringify(reqOpts.body) : undefined,
        })

        let json: { data?: T; error?: { code: string; message: string } } = {}
        try {
          json = (await res.json()) as typeof json
        } catch {
          // Response body is not JSON
        }

        if (!res.ok) {
          const error = json.error ?? {
            code: `HTTP_${res.status}`,
            message: res.statusText || `Request failed with status ${res.status}`,
          }
          return { data: null, error, status: res.status, headers: res.headers }
        }

        return {
          data: json.data ?? null,
          error: null,
          status: res.status,
          headers: res.headers,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          data: null,
          error: { code: 'NETWORK_ERROR', message: `Network error: ${message}` },
          status: 0,
          headers: new Headers(),
        }
      }
    },
  }
}

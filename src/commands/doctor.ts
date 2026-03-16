import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../lib/client.js'
import {
  resolveApiKey,
  resolveBaseUrl,
  readCredentials,
  maskApiKey,
} from '../lib/config.js'
import type { GlobalOpts } from '../lib/config.js'
import { shouldOutputJson, ExitCode } from '../lib/output.js'
import { VERSION } from '../lib/constants.js'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  detail?: string
}

interface HelpCenter {
  name: string
  subdomain: string
}

interface ArticleList {
  items?: unknown[]
  total?: number
}

function resolveKeySource(opts: GlobalOpts): string {
  if (opts.apiKey) return 'flag'
  if (process.env.SELVO_API_KEY) return 'env'
  return 'config'
}

export function makeDoctorCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('doctor')
    .description('Run diagnostic checks on your Selvo CLI setup')
    .action(async () => {
      const opts = globalOpts()
      const jsonMode = shouldOutputJson(opts)
      const checks: CheckResult[] = []

      const pass = (name: string, message: string, detail?: string): CheckResult => ({
        name,
        status: 'pass',
        message,
        detail,
      })

      const fail = (name: string, message: string, detail?: string): CheckResult => ({
        name,
        status: 'fail',
        message,
        detail,
      })

      const warn = (name: string, message: string, detail?: string): CheckResult => ({
        name,
        status: 'warn',
        message,
        detail,
      })

      // 1. CLI Version
      checks.push(pass('CLI Version', `v${VERSION}`))

      if (!jsonMode) {
        process.stderr.write(`${pc.green('✓')} CLI Version: v${VERSION}\n`)
      }

      // 2. API Key
      const apiKey = resolveApiKey(opts)
      const creds = readCredentials()
      const profileName =
        opts.profile ??
        process.env.SELVO_PROFILE ??
        creds?.active_profile ??
        'default'

      if (apiKey) {
        const keySource = resolveKeySource(opts)
        const masked = maskApiKey(apiKey)
        checks.push(
          pass('API Key', `Configured (${masked})`, `Source: ${keySource} · Profile: ${profileName}`)
        )
        if (!jsonMode) {
          process.stderr.write(
            `${pc.green('✓')} API Key: ${masked} ${pc.dim(`(${keySource})`)}\n`
          )
        }
      } else {
        checks.push(fail('API Key', 'Not configured', 'Run `selvo login` or set SELVO_API_KEY'))
        if (!jsonMode) {
          process.stderr.write(
            `${pc.red('✗')} API Key: ${pc.red('Not configured')}\n`
          )
          process.stderr.write(
            pc.dim('  Run `selvo login` or set SELVO_API_KEY\n')
          )
        }
        // Still run the rest with potentially no key (they'll just fail)
      }

      // 3. API Connection — call GET /api/v1/help-center
      if (!apiKey) {
        checks.push(fail('API Connection', 'Skipped (no API key)'))
        checks.push(fail('Help Center', 'Skipped (no API key)'))

        if (!jsonMode) {
          process.stderr.write(`${pc.red('✗')} API Connection: Skipped (no API key)\n`)
          process.stderr.write(`${pc.red('✗')} Help Center: Skipped (no API key)\n`)
        }
      } else {
        const baseUrl = resolveBaseUrl(opts)
        const client = createClient(opts)

        // API Connection check
        const connStart = Date.now()
        try {
          const res = await client.request<HelpCenter>('GET', '/help-center')
          const latencyMs = Date.now() - connStart

          if (res.error) {
            checks.push(
              fail('API Connection', `Failed — ${res.error.message}`, `Status: ${res.status}`)
            )
            if (!jsonMode) {
              process.stderr.write(
                `${pc.red('✗')} API Connection: ${pc.red(res.error.message)}\n`
              )
            }
            checks.push(fail('Help Center', 'Skipped (connection failed)'))
            if (!jsonMode) {
              process.stderr.write(`${pc.red('✗')} Help Center: Skipped (connection failed)\n`)
            }
          } else {
            const hc = res.data!
            checks.push(
              pass(
                'API Connection',
                `Connected (${latencyMs}ms)`,
                `Base URL: ${baseUrl}`
              )
            )
            if (!jsonMode) {
              process.stderr.write(
                `${pc.green('✓')} API Connection: Connected ${pc.dim(`(${latencyMs}ms)`)}\n`
              )
            }

            // 4. Help Center — call GET /api/v1/articles and count
            try {
              const articlesRes = await client.request<ArticleList>('GET', '/articles')
              let articleCount: number | string = 'unknown'

              if (!articlesRes.error && articlesRes.data) {
                const d = articlesRes.data
                if (typeof d.total === 'number') {
                  articleCount = d.total
                } else if (Array.isArray(d)) {
                  articleCount = (d as unknown[]).length
                } else if (Array.isArray(d.items)) {
                  articleCount = d.items.length
                }
              }

              checks.push(
                pass(
                  'Help Center',
                  `${hc.name} (${hc.subdomain}.selvo.help)`,
                  `Articles: ${articleCount}`
                )
              )
              if (!jsonMode) {
                process.stderr.write(
                  `${pc.green('✓')} Help Center: ${hc.name} ${pc.dim(`(${hc.subdomain}.selvo.help · ${articleCount} articles)`)}\n`
                )
              }
            } catch {
              checks.push(
                warn('Help Center', `${hc.name} (${hc.subdomain}.selvo.help)`, 'Could not fetch article count')
              )
              if (!jsonMode) {
                process.stderr.write(
                  `${pc.green('✓')} Help Center: ${hc.name} ${pc.dim(`(${hc.subdomain}.selvo.help)`)}\n`
                )
              }
            }
          }
        } catch (err) {
          const latencyMs = Date.now() - connStart
          const msg = err instanceof Error ? err.message : String(err)
          checks.push(fail('API Connection', `Network error — ${msg}`))
          if (!jsonMode) {
            process.stderr.write(
              `${pc.red('✗')} API Connection: ${pc.red(`Network error — ${msg}`)}\n`
            )
          }
          checks.push(fail('Help Center', 'Skipped (connection failed)'))
          if (!jsonMode) {
            process.stderr.write(`${pc.red('✗')} Help Center: Skipped (connection failed)\n`)
          }
        }
      }

      const allOk = checks.every((c) => c.status === 'pass')

      if (jsonMode) {
        process.stdout.write(
          JSON.stringify({ ok: allOk, checks }, null, 2) + '\n'
        )
      } else {
        process.stderr.write('\n')
        if (allOk) {
          process.stderr.write(pc.green('All checks passed.') + '\n')
        } else {
          const failed = checks.filter((c) => c.status === 'fail').length
          process.stderr.write(
            pc.red(`${failed} check${failed === 1 ? '' : 's'} failed.`) + '\n'
          )
          process.exit(ExitCode.API_ERROR)
        }
      }
    })
}

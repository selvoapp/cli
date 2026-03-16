import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../lib/client.js'
import {
  resolveApiKey,
  resolveBaseUrl,
  getActiveProfile,
  maskApiKey,
  readCredentials,
} from '../lib/config.js'
import type { GlobalOpts } from '../lib/config.js'
import { shouldOutputJson, ExitCode } from '../lib/output.js'

interface HelpCenter {
  id: string
  name: string
  subdomain: string
  [key: string]: unknown
}

function resolveKeySource(opts: GlobalOpts): string {
  if (opts.apiKey) return 'flag'
  if (process.env.SELVO_API_KEY) return 'env'
  return 'config'
}

export function makeWhoamiCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('whoami')
    .description('Show the current authenticated profile and help center')
    .action(async () => {
      const opts = globalOpts()
      const apiKey = resolveApiKey(opts)

      if (!apiKey) {
        process.stderr.write(
          pc.red('Error: No API key found. Run `selvo login` or set SELVO_API_KEY.') + '\n'
        )
        process.exit(ExitCode.AUTH_ERROR)
      }

      const baseUrl = resolveBaseUrl(opts)
      const keySource = resolveKeySource(opts)

      const creds = readCredentials()
      const profileName =
        opts.profile ??
        process.env.SELVO_PROFILE ??
        creds?.active_profile ??
        'default'

      const client = createClient(opts)

      let helpCenter: HelpCenter
      try {
        const res = await client.request<HelpCenter>('GET', '/help-center')
        if (res.error) {
          process.stderr.write(
            pc.red(`Error: ${res.error.message}`) + '\n'
          )
          process.exit(ExitCode.AUTH_ERROR)
        }
        helpCenter = res.data!
      } catch {
        process.stderr.write(pc.red('Error: Failed to connect to API') + '\n')
        process.exit(ExitCode.AUTH_ERROR)
      }

      if (shouldOutputJson(opts)) {
        process.stdout.write(
          JSON.stringify(
            {
              profile: profileName,
              api_key_masked: maskApiKey(apiKey),
              key_source: keySource,
              base_url: baseUrl,
              help_center: helpCenter,
            },
            null,
            2
          ) + '\n'
        )
        return
      }

      process.stdout.write(`${pc.bold('Profile:')}    ${profileName}\n`)
      process.stdout.write(
        `${pc.bold('API Key:')}    ${maskApiKey(apiKey)} ${pc.dim(`(via ${keySource})`)}\n`
      )
      process.stdout.write(`${pc.bold('Base URL:')}   ${baseUrl}\n`)
      process.stdout.write('\n')
      process.stdout.write(`${pc.bold('Help Center:')} ${helpCenter.name}\n`)
      process.stdout.write(
        `${pc.bold('Subdomain:')}  ${helpCenter.subdomain}.selvo.help\n`
      )
      process.stdout.write(
        `${pc.bold('URL:')}        https://${helpCenter.subdomain}.selvo.help\n`
      )
    })
}

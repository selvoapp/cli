import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import {
  addProfile,
  setActiveProfile,
  readCredentials,
  maskApiKey,
  resolveBaseUrl,
} from '../../lib/config.js'
import type { GlobalOpts } from '../../lib/config.js'
import { ExitCode } from '../../lib/output.js'
import { isInteractive } from '../../lib/tty.js'

interface HelpCenter {
  name: string
  subdomain: string
}

export function makeLoginCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('login')
    .description('Authenticate with your Selvo API key')
    .option('--key <key>', 'API key to use (skips interactive prompt)')
    .option('--profile <name>', 'Profile name to save as')
    .action(async (opts) => {
      const merged: GlobalOpts = {
        ...globalOpts(),
        ...(opts.profile ? { profile: opts.profile } : {}),
      }

      let apiKey: string | undefined = opts.key

      // If no key flag provided, prompt interactively
      if (!apiKey) {
        if (!isInteractive()) {
          process.stderr.write(
            'Error: Non-interactive mode requires --key <key>\n'
          )
          process.exit(ExitCode.VALIDATION_ERROR)
        }

        const { password } = await import('@clack/prompts')
        const result = await password({
          message: 'Enter your Selvo API key:',
          validate(value) {
            if (!value || value.trim().length === 0) return 'API key is required'
          },
        })

        // Handle cancel
        const { isCancel } = await import('@clack/prompts')
        if (isCancel(result)) {
          process.stderr.write('Cancelled.\n')
          process.exit(ExitCode.SUCCESS)
        }

        apiKey = result as string
      }

      // Validate the key by calling the API
      const baseUrl = resolveBaseUrl(merged)
      const clientOpts: GlobalOpts = { ...merged, apiKey, baseUrl }
      const client = createClient(clientOpts)

      let helpCenter: HelpCenter
      try {
        const res = await client.request<HelpCenter>('GET', '/help-center')
        if (res.error) {
          process.stderr.write(
            pc.red(`Authentication failed: ${res.error.message}`) + '\n'
          )
          process.exit(ExitCode.AUTH_ERROR)
        }
        helpCenter = res.data!
      } catch {
        process.stderr.write(pc.red('Error: Failed to connect to API') + '\n')
        process.exit(ExitCode.AUTH_ERROR)
      }

      // Determine profile name
      let profileName = opts.profile ?? merged.profile

      if (!profileName) {
        // Check if this is the first profile
        const existing = readCredentials()
        const hasProfiles =
          existing && Object.keys(existing.profiles).length > 0
        const defaultName = hasProfiles ? helpCenter.subdomain : 'default'

        if (isInteractive()) {
          const { text, isCancel } = await import('@clack/prompts')
          const nameResult = await text({
            message: 'Profile name:',
            placeholder: defaultName,
            defaultValue: defaultName,
          })

          if (isCancel(nameResult)) {
            process.stderr.write('Cancelled.\n')
            process.exit(ExitCode.SUCCESS)
          }

          profileName = (nameResult as string) || defaultName
        } else {
          profileName = defaultName
        }
      }

      // Store credentials
      addProfile(profileName, { api_key: apiKey, base_url: baseUrl })
      setActiveProfile(profileName)

      process.stderr.write(
        pc.green('✓') +
          ` Logged in to ${pc.bold(helpCenter.name)} (${helpCenter.subdomain}.selvo.help)\n`
      )
      process.stderr.write(
        pc.dim(`  Profile: ${profileName} · Key: ${maskApiKey(apiKey)}`) + '\n'
      )
    })
}

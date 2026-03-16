import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import {
  readCredentials,
  setActiveProfile,
  resolveBaseUrl,
} from '../../lib/config.js'
import type { GlobalOpts } from '../../lib/config.js'
import { ExitCode } from '../../lib/output.js'
import { isInteractive } from '../../lib/tty.js'

interface HelpCenter {
  name: string
  subdomain: string
}

// Return type uses any generics to avoid TypeScript inference issues with positional argument types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeAuthSwitchCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  return new Command('switch')
    .description('Switch active profile')
    .argument('[profile]', 'Profile name to switch to')
    .action(async (profileArg) => {
      const opts = globalOpts()
      const creds = readCredentials()

      if (!creds || Object.keys(creds.profiles).length === 0) {
        process.stderr.write(
          'No profiles configured. Run `selvo login` to get started.\n'
        )
        process.exit(ExitCode.VALIDATION_ERROR)
      }

      const profileNames = Object.keys(creds.profiles)
      let targetProfile = profileArg

      // If no argument, prompt interactively
      if (!targetProfile) {
        if (!isInteractive()) {
          process.stderr.write('Error: Profile name is required in non-interactive mode\n')
          process.exit(ExitCode.VALIDATION_ERROR)
        }

        const { select, isCancel } = await import('@clack/prompts')
        const result = await select({
          message: 'Select profile:',
          options: profileNames.map((name) => ({
            value: name,
            label: name === creds.active_profile ? `${name} (active)` : name,
          })),
        })

        if (isCancel(result)) {
          process.stderr.write('Cancelled.\n')
          process.exit(ExitCode.SUCCESS)
        }

        targetProfile = result as string
      }

      // Verify profile exists
      if (!creds.profiles[targetProfile]) {
        process.stderr.write(
          pc.red(`Error: Profile "${targetProfile}" not found`) + '\n'
        )
        process.stderr.write(
          pc.dim(`  Available profiles: ${profileNames.join(', ')}`) + '\n'
        )
        process.exit(ExitCode.VALIDATION_ERROR)
      }

      // Switch to the profile
      setActiveProfile(targetProfile)

      // Validate by calling the API
      const profile = creds.profiles[targetProfile]!
      const clientOpts: GlobalOpts = {
        ...opts,
        apiKey: profile.api_key,
        baseUrl: profile.base_url,
      }
      const client = createClient(clientOpts)

      try {
        const res = await client.request<HelpCenter>('GET', '/help-center')
        if (res.error) {
          process.stderr.write(
            pc.yellow(`Warning: API validation failed — ${res.error.message}`) + '\n'
          )
        } else {
          const hc = res.data!
          process.stderr.write(
            pc.green('✓') +
              ` Switched to ${pc.bold(targetProfile)} — ${hc.name} (${hc.subdomain}.selvo.help)\n`
          )
          return
        }
      } catch {
        process.stderr.write(pc.yellow('Warning: Could not validate API connection') + '\n')
      }

      process.stderr.write(pc.green('✓') + ` Switched to ${pc.bold(targetProfile)}\n`)
    })
}

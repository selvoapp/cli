import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { readCredentials, maskApiKey } from '../../lib/config.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson } from '../../lib/output.js'
import { DEFAULT_BASE_URL } from '../../lib/constants.js'

export function makeAuthListCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('list')
    .description('List all configured profiles')
    .action(() => {
      const opts = globalOpts()
      const creds = readCredentials()

      if (!creds || Object.keys(creds.profiles).length === 0) {
        if (shouldOutputJson(opts)) {
          process.stdout.write(JSON.stringify([], null, 2) + '\n')
        } else {
          process.stdout.write(
            'No profiles configured. Run `selvo login` to get started.\n'
          )
        }
        return
      }

      const profiles = Object.entries(creds.profiles).map(([name, profile]) => ({
        name,
        active: name === creds.active_profile,
        api_key_masked: maskApiKey(profile.api_key),
        base_url: profile.base_url ?? DEFAULT_BASE_URL,
      }))

      if (shouldOutputJson(opts)) {
        process.stdout.write(JSON.stringify(profiles, null, 2) + '\n')
        return
      }

      // Interactive table output
      const nameWidth = Math.max(
        9, // length of "  PROFILE"
        ...profiles.map((p) => p.name.length + 2)
      )
      const keyWidth = 18
      const urlWidth = Math.max(
        8,
        ...profiles.map((p) => p.base_url.length)
      )

      const pad = (s: string, w: number) => s.padEnd(w)

      process.stdout.write(
        pc.dim(
          pad('  PROFILE', nameWidth) +
            '  ' +
            pad('KEY', keyWidth) +
            '  ' +
            'BASE URL'
        ) + '\n'
      )
      process.stdout.write(
        pc.dim('-'.repeat(nameWidth + 2 + keyWidth + 2 + urlWidth)) + '\n'
      )

      for (const p of profiles) {
        const marker = p.active ? '* ' : '  '
        const nameCol = pad(marker + p.name, nameWidth)
        const row =
          (p.active ? pc.green(nameCol) : nameCol) +
          '  ' +
          pad(p.api_key_masked, keyWidth) +
          '  ' +
          p.base_url
        process.stdout.write(row + '\n')
      }
    })
}

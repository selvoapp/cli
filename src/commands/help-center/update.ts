import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

interface UpdatedHelpCenter {
  name?: string
  subdomain?: string
  [key: string]: unknown
}

export function makeHelpCenterUpdateCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('update')
    .description('Update help center settings')
    .option('--name <name>', 'Help center name')
    .option('--subdomain <subdomain>', 'Subdomain (e.g. "acme" → acme.selvo.help)')
    .option('--json-body <json>', 'Raw JSON body for advanced settings (merged with other flags)')
    .action(async (opts) => {
      const global = globalOpts()

      const body: Record<string, unknown> = {}

      // Parse --json-body first so named flags can override
      if (opts.jsonBody) {
        try {
          const parsed = JSON.parse(opts.jsonBody) as Record<string, unknown>
          Object.assign(body, parsed)
        } catch {
          process.stderr.write(pc.red('Error: --json-body must be valid JSON.') + '\n')
          process.exit(ExitCode.VALIDATION_ERROR)
        }
      }

      if (opts.name) body.name = opts.name
      if (opts.subdomain) body.subdomain = opts.subdomain

      if (Object.keys(body).length === 0) {
        process.stderr.write(
          pc.red('Error: No fields to update. Provide at least one option.') + '\n'
        )
        process.exit(ExitCode.VALIDATION_ERROR)
      }

      const client = createClient(global)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Updating help center...',
            success: 'Updated help center',
            fail: 'Failed to update help center',
          },
          () => client.request('PATCH', '/help-center', { body }),
          global
        )
      } catch (err) {
        const error = err as { code: string; message: string }
        outputError(error, global)
        process.exit(ExitCode.API_ERROR)
      }

      if (shouldOutputJson(global)) {
        process.stdout.write(JSON.stringify(data, null, 2) + '\n')
        return
      }

      const hc = data as UpdatedHelpCenter
      process.stdout.write(
        pc.green('✓') + ` Updated help center${hc.name ? ` "${hc.name}"` : ''}\n`
      )
    })
}

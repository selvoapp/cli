import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, outputResult, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

interface HelpCenter {
  name: string
  subdomain: string
  custom_domain?: string
  locale?: string
  plan?: string
  [key: string]: unknown
}

export function makeHelpCenterGetCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('get')
    .description('Show help center information and settings')
    .action(async () => {
      const opts = globalOpts()
      const client = createClient(opts)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Fetching help center...',
            success: 'Fetched help center',
            fail: 'Failed to fetch help center',
          },
          () => client.request('GET', '/help-center'),
          opts
        )
      } catch (err) {
        const error = err as { code: string; message: string }
        outputError(error, opts)
        process.exit(ExitCode.API_ERROR)
      }

      if (shouldOutputJson(opts)) {
        outputResult(data, opts)
        return
      }

      // Interactive mode: show name, subdomain, URL, settings summary
      const hc = data as HelpCenter
      process.stdout.write(`${pc.bold(hc.name)}\n`)
      process.stdout.write(`${pc.dim('Subdomain:')} ${hc.subdomain}.selvo.help\n`)
      if (hc.custom_domain) {
        process.stdout.write(`${pc.dim('Custom domain:')} ${hc.custom_domain}\n`)
      }
      if (hc.locale) {
        process.stdout.write(`${pc.dim('Locale:')} ${hc.locale}\n`)
      }
      if (hc.plan) {
        process.stdout.write(`${pc.dim('Plan:')} ${hc.plan}\n`)
      }
    })
}

import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

interface CreatedDomain {
  id: string
  hostname: string
  [key: string]: unknown
}

export function makeDomainsCreateCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('create')
    .description('Add a custom domain to your help center')
    .requiredOption('--hostname <domain>', 'Domain hostname (e.g. help.example.com) (required)')
    .action(async (opts) => {
      const global = globalOpts()

      const body = { hostname: opts.hostname }
      const client = createClient(global)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Adding domain...',
            success: 'Added domain',
            fail: 'Failed to add domain',
          },
          () => client.request('POST', '/domains', { body }),
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

      const domain = data as CreatedDomain
      process.stdout.write(
        pc.green('✓') + ` Added domain "${pc.bold(domain.hostname)}"\n` +
          `  ${pc.dim('Run')} selvo domains verify ${domain.id} ${pc.dim('after configuring DNS.')}\n`
      )
    })
}

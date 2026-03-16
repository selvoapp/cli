import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, outputResult, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

interface VerifyResult {
  verified?: boolean
  hostname?: string
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeDomainsVerifyCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  return new Command('verify')
    .description('Verify DNS configuration for a custom domain')
    .argument('<id>', 'Domain ID')
    .action(async (id) => {
      const opts = globalOpts()
      const client = createClient(opts)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Verifying domain...',
            success: 'Domain verification complete',
            fail: 'Failed to verify domain',
          },
          () => client.request('POST', `/domains/${id}/verify`),
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

      const result = data as VerifyResult
      if (result.verified) {
        process.stdout.write(
          pc.green('✓') + ` Domain ${result.hostname ?? id} is verified\n`
        )
      } else {
        process.stdout.write(
          pc.yellow('!') + ` Domain ${result.hostname ?? id} is not yet verified\n` +
            `  ${pc.dim('Check that your DNS CNAME record points to cname.selvo.co')}\n`
        )
      }
    })
}

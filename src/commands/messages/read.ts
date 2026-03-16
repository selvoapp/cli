import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, outputResult, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeMessagesReadCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  return new Command('read')
    .description('Mark a message as read')
    .argument('<id>', 'Message ID')
    .action(async (id) => {
      const opts = globalOpts()
      const client = createClient(opts)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Marking message as read...',
            success: 'Marked message as read',
            fail: 'Failed to mark message as read',
          },
          () => client.request('PATCH', `/messages/${id}`, { body: { read: true } }),
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

      process.stdout.write(pc.green('✓') + ' Marked message as read\n')
    })
}

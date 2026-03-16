import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeCollectionsDeleteCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  return new Command('delete')
    .description('Delete a collection')
    .argument('<id>', 'Collection ID')
    .action(async (id) => {
      const global = globalOpts()
      const client = createClient(global)

      // In interactive mode, confirm before deleting
      if (!shouldOutputJson(global)) {
        const { confirm, isCancel } = await import('@clack/prompts')
        const confirmed = await confirm({
          message: `Delete collection ${id}? This cannot be undone.`,
        })

        if (isCancel(confirmed) || !confirmed) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Deleting collection...',
            success: 'Deleted collection',
            fail: 'Failed to delete collection',
          },
          () => client.request('DELETE', `/collections/${id}`),
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

      process.stdout.write(pc.green('✓') + ` Deleted collection ${id}\n`)
    })
}

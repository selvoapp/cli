import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

export function makeArticlesReorderCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('reorder')
    .description('Reorder articles by specifying their IDs in order')
    .requiredOption('--ids <ids>', 'Comma-separated article IDs in the desired order (required)')
    .action(async (opts) => {
      const global = globalOpts()

      const ids = opts.ids
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)

      if (ids.length === 0) {
        process.stderr.write(pc.red('Error: --ids must contain at least one ID.') + '\n')
        process.exit(ExitCode.VALIDATION_ERROR)
      }

      const items = ids.map((id: string, index: number) => ({ id, order: index + 1 }))
      const body = { items }

      const client = createClient(global)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Reordering articles...',
            success: 'Reordered articles',
            fail: 'Failed to reorder articles',
          },
          () => client.request('POST', '/articles/reorder', { body }),
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

      process.stdout.write(pc.green('✓') + ` Reordered ${ids.length} articles\n`)
    })
}

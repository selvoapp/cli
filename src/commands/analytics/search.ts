import { Command } from '@commander-js/extra-typings'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, outputResult, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'
import { renderTable } from '../../lib/table.js'
import { addPeriodFlags, buildPeriodParams } from './flags.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeAnalyticsSearchCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  const cmd = new Command('search')
    .description('Show search query analytics')
    .option('--filter <filter>', 'Filter results: all, missed, or hit', 'all')
  addPeriodFlags(cmd)

  cmd.action(async (opts) => {
    const global = globalOpts()
    const typedOpts = opts as { period?: string; from?: string; to?: string; filter?: string }
    const params = buildPeriodParams(typedOpts)
    if (typedOpts.filter && typedOpts.filter !== 'all') params.filter = typedOpts.filter

    let data: unknown
    try {
      data = await withSpinner(
        {
          loading: 'Fetching search analytics...',
          success: 'Fetched search analytics',
          fail: 'Failed to fetch search analytics',
        },
        () => createClient(global).request('GET', '/analytics/search', { params }),
        global
      )
    } catch (err) {
      const error = err as { code: string; message: string }
      outputError(error, global)
      process.exit(ExitCode.API_ERROR)
    }

    if (shouldOutputJson(global)) {
      outputResult(data, global)
      return
    }

    if (!Array.isArray(data) || data.length === 0) {
      process.stdout.write('No search analytics found.\n')
      return
    }

    const rows = data as Record<string, unknown>[]
    process.stdout.write(
      renderTable(rows, [
        { key: 'query', header: 'Query', width: 40 },
        { key: 'count', header: 'Count', width: 8 },
        { key: 'has_results', header: 'Has Results', width: 12 },
      ]) + '\n'
    )
  })

  return cmd
}

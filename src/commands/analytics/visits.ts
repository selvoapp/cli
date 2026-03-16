import { Command } from '@commander-js/extra-typings'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, outputResult, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'
import { renderTable } from '../../lib/table.js'
import { addPeriodFlags, buildPeriodParams } from './flags.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeAnalyticsVisitsCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  const cmd = new Command('visits').description('Show daily visit stats for your help center')
  addPeriodFlags(cmd)

  cmd.action(async (opts) => {
    const global = globalOpts()
    const params = buildPeriodParams(opts as { period?: string; from?: string; to?: string })

    let data: unknown
    try {
      data = await withSpinner(
        {
          loading: 'Fetching visits...',
          success: 'Fetched visits',
          fail: 'Failed to fetch visits',
        },
        () => createClient(global).request('GET', '/analytics/visits', { params }),
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
      process.stdout.write('No visit data found.\n')
      return
    }

    const rows = data as Record<string, unknown>[]
    process.stdout.write(
      renderTable(rows, [
        { key: 'date', header: 'Date', width: 12 },
        { key: 'visitors', header: 'Visitors', width: 10 },
        { key: 'views', header: 'Views', width: 10 },
      ]) + '\n'
    )
  })

  return cmd
}

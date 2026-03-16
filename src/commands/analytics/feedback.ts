import { Command } from '@commander-js/extra-typings'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, outputResult, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'
import { renderTable } from '../../lib/table.js'
import { addPeriodFlags, buildPeriodParams } from './flags.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeAnalyticsFeedbackCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  const cmd = new Command('feedback').description('Show article feedback ratings')
  addPeriodFlags(cmd)

  cmd.action(async (opts) => {
    const global = globalOpts()
    const params = buildPeriodParams(opts as { period?: string; from?: string; to?: string })

    let data: unknown
    try {
      data = await withSpinner(
        {
          loading: 'Fetching feedback...',
          success: 'Fetched feedback',
          fail: 'Failed to fetch feedback',
        },
        () => createClient(global).request('GET', '/analytics/feedback', { params }),
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
      process.stdout.write('No feedback found.\n')
      return
    }

    const rows = data as Record<string, unknown>[]
    process.stdout.write(
      renderTable(rows, [
        { key: 'article_title', header: 'Article', width: 35 },
        { key: 'rating', header: 'Rating', width: 10 },
        { key: 'comment', header: 'Comment', width: 40 },
        { key: 'created_at', header: 'Date', width: 20 },
      ]) + '\n'
    )
  })

  return cmd
}

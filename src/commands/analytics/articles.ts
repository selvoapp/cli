import { Command } from '@commander-js/extra-typings'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, outputResult, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'
import { renderTable } from '../../lib/table.js'
import { addPeriodFlags, buildPeriodParams } from './flags.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeAnalyticsArticlesCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  const cmd = new Command('articles').description('Show top articles by views')
  addPeriodFlags(cmd)

  cmd.action(async (opts) => {
    const global = globalOpts()
    const params = buildPeriodParams(opts as { period?: string; from?: string; to?: string })

    let data: unknown
    try {
      data = await withSpinner(
        {
          loading: 'Fetching article analytics...',
          success: 'Fetched article analytics',
          fail: 'Failed to fetch article analytics',
        },
        () => createClient(global).request('GET', '/analytics/articles', { params }),
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
      process.stdout.write('No article analytics found.\n')
      return
    }

    const rows = data as Record<string, unknown>[]
    process.stdout.write(
      renderTable(rows, [
        { key: 'number', header: '#', width: 6 },
        { key: 'title', header: 'Title', width: 40 },
        { key: 'views', header: 'Views', width: 8 },
        { key: 'helpful', header: 'Helpful', width: 9 },
        { key: 'unhelpful', header: 'Not Helpful', width: 11 },
      ]) + '\n'
    )
  })

  return cmd
}

import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, outputResult, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'
import { addPeriodFlags, buildPeriodParams } from './flags.js'

interface AnalyticsOverview {
  visitors: number
  views: number
  searches: number
  helpfulness_rate?: number
  period?: string
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeAnalyticsOverviewCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  const cmd = new Command('overview').description('Show analytics overview for your help center')
  addPeriodFlags(cmd)

  cmd.action(async (opts) => {
    const global = globalOpts()
    const params = buildPeriodParams(opts as { period?: string; from?: string; to?: string })

    let data: unknown
    try {
      data = await withSpinner(
        {
          loading: 'Fetching analytics...',
          success: 'Fetched analytics',
          fail: 'Failed to fetch analytics',
        },
        () => createClient(global).request('GET', '/analytics/overview', { params }),
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

    // Interactive: show key stats with labels
    const overview = data as AnalyticsOverview
    process.stdout.write(pc.bold('Analytics Overview') + '\n\n')
    process.stdout.write(`  ${pc.dim('Visitors:')}        ${overview.visitors ?? 0}\n`)
    process.stdout.write(`  ${pc.dim('Page Views:')}      ${overview.views ?? 0}\n`)
    process.stdout.write(`  ${pc.dim('Searches:')}        ${overview.searches ?? 0}\n`)
    if (overview.helpfulness_rate !== undefined) {
      const rate = (overview.helpfulness_rate * 100).toFixed(1)
      process.stdout.write(`  ${pc.dim('Helpfulness Rate:')} ${rate}%\n`)
    }
    if (overview.period) {
      process.stdout.write(`\n  ${pc.dim('Period:')} ${overview.period}\n`)
    }
  })

  return cmd
}

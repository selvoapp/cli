import { Command } from '@commander-js/extra-typings'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, outputResult, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'
import { renderTable } from '../../lib/table.js'

export function makeMessagesListCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('list')
    .description('List contact messages')
    .option('--limit <n>', 'Number of messages to return', '50')
    .action(async (opts) => {
      const global = globalOpts()
      const params: Record<string, string> = {}
      if (opts.limit) params.limit = opts.limit

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Fetching messages...',
            success: 'Fetched messages',
            fail: 'Failed to fetch messages',
          },
          () => createClient(global).request('GET', '/messages', { params }),
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
        process.stdout.write('No messages found.\n')
        return
      }

      const rows = data as Record<string, unknown>[]
      process.stdout.write(
        renderTable(rows, [
          { key: 'id', header: 'ID', width: 20 },
          { key: 'name', header: 'Name', width: 20 },
          { key: 'email', header: 'Email', width: 25 },
          { key: 'subject', header: 'Subject / Snippet', width: 35 },
          { key: 'created_at', header: 'Date', width: 20 },
        ]) + '\n'
      )
    })
}

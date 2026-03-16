import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, outputResult, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

interface Message {
  id: string
  name?: string
  email?: string
  subject?: string
  message?: string
  created_at?: string
  read?: boolean
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeMessagesGetCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  return new Command('get')
    .description('Get a message by ID')
    .argument('<id>', 'Message ID')
    .action(async (id) => {
      const opts = globalOpts()
      const client = createClient(opts)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Fetching message...',
            success: 'Fetched message',
            fail: 'Failed to fetch message',
          },
          () => client.request('GET', `/messages/${id}`),
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

      // Interactive: show full message details
      const msg = data as Message
      process.stdout.write(`${pc.bold(msg.subject ?? '(no subject)')}\n`)
      process.stdout.write(`${pc.dim('From:')}  ${msg.name ?? ''} <${msg.email ?? ''}>\n`)
      if (msg.created_at) {
        process.stdout.write(`${pc.dim('Date:')}  ${msg.created_at}\n`)
      }
      if (msg.read !== undefined) {
        process.stdout.write(`${pc.dim('Read:')}  ${msg.read ? 'yes' : 'no'}\n`)
      }
      process.stdout.write('\n')
      if (msg.message) {
        process.stdout.write(msg.message + '\n')
      } else {
        process.stdout.write(pc.dim('(no message body)') + '\n')
      }
    })
}

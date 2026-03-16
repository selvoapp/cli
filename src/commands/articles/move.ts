import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

interface Article {
  number: number
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeArticlesMoveCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  return new Command('move')
    .description('Move an article to a different collection')
    .argument('<id>', 'Article ID or number')
    .requiredOption('--collection <id>', 'Target collection ID (required)')
    .action(async (id, opts) => {
      const global = globalOpts()
      const client = createClient(global)

      const body = { collection_id: opts.collection }

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Moving article...',
            success: 'Moved article',
            fail: 'Failed to move article',
          },
          () => client.request('POST', `/articles/${id}/move`, { body }),
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

      const article = data as Article
      const num = article?.number ?? id
      process.stdout.write(
        pc.green('✓') + ` Moved article #${num} to collection ${opts.collection}\n`
      )
    })
}

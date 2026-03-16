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
export function makeArticlesPublishCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  return new Command('publish')
    .description('Publish an article')
    .argument('<id>', 'Article ID or number')
    .action(async (id) => {
      const global = globalOpts()
      const client = createClient(global)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Publishing article...',
            success: 'Published article',
            fail: 'Failed to publish article',
          },
          () => client.request('POST', `/articles/${id}/publish`),
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
      process.stdout.write(pc.green('✓') + ` Published article #${num}\n`)
    })
}

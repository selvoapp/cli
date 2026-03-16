import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, outputResult, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

interface Article {
  number: number
  title: string
  status: string
  slug: string
  content_markdown?: string
  content_text?: string
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeArticlesGetCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  return new Command('get')
    .description('Get an article by ID or number')
    .argument('<id>', 'Article ID or number')
    .action(async (id) => {
      const opts = globalOpts()
      const client = createClient(opts)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Fetching article...',
            success: 'Fetched article',
            fail: 'Failed to fetch article',
          },
          () => client.request('GET', `/articles/${id}`),
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

      // Interactive mode: show article metadata + markdown content
      const article = data as Article
      process.stdout.write(`${pc.bold(article.title)}\n`)
      process.stdout.write(`${pc.dim('Status:')} ${article.status}`)

      // Try to show URL if we can
      if (article.number && article.slug) {
        process.stdout.write(`  ${pc.dim('URL:')} /articles/${article.number}-${article.slug}`)
      }
      process.stdout.write('\n\n')

      const content = article.content_markdown ?? article.content_text
      if (content) {
        process.stdout.write(content + '\n')
      } else {
        process.stdout.write(pc.dim('(no content)') + '\n')
      }
    })
}

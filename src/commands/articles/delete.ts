import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

interface Article {
  number: number
  title?: string
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeArticlesDeleteCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  return new Command('delete')
    .description('Delete an article')
    .argument('<id>', 'Article ID or number')
    .action(async (id) => {
      const global = globalOpts()
      const client = createClient(global)

      // In interactive mode, fetch article info first for confirmation prompt
      if (!shouldOutputJson(global)) {
        let article: Article | null = null
        try {
          const res = await client.request<Article>('GET', `/articles/${id}`)
          if (!res.error && res.data) {
            article = res.data
          }
        } catch {
          // Ignore — will fail again on delete and show proper error
        }

        const label = article
          ? `article #${article.number}${article.title ? ` "${article.title}"` : ''}`
          : `article ${id}`

        const { confirm, isCancel } = await import('@clack/prompts')
        const confirmed = await confirm({
          message: `Delete ${label}? This cannot be undone.`,
        })

        if (isCancel(confirmed) || !confirmed) {
          process.stdout.write('Cancelled.\n')
          return
        }
      }

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Deleting article...',
            success: 'Deleted article',
            fail: 'Failed to delete article',
          },
          () => client.request('DELETE', `/articles/${id}`),
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
      process.stdout.write(pc.green('✓') + ` Deleted article #${num}\n`)
    })
}

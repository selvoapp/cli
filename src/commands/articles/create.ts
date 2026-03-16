import { Command } from '@commander-js/extra-typings'
import { readFileSync } from 'fs'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

interface CreatedArticle {
  number: number
  title: string
  slug?: string
  [key: string]: unknown
}

export function makeArticlesCreateCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('create')
    .description('Create a new article')
    .requiredOption('--title <title>', 'Article title (required)')
    .requiredOption('--collection <id>', 'Collection ID (required)')
    .option('--content <markdown>', 'Article content as markdown')
    .option('--file <path>', 'Path to a markdown file to use as content')
    .option('--status <status>', 'Initial status (draft, published)')
    .option('--excerpt <text>', 'Article excerpt')
    .option('--slug <slug>', 'Article slug (auto-generated from title if omitted)')
    .action(async (opts) => {
      const global = globalOpts()

      // Validate: cannot use both --content and --file
      if (opts.content && opts.file) {
        process.stderr.write(
          pc.red('Error: Cannot use both --content and --file. Choose one.') + '\n'
        )
        process.exit(ExitCode.VALIDATION_ERROR)
      }

      // Read content from file if --file provided
      let content: string | undefined = opts.content
      if (opts.file) {
        try {
          content = readFileSync(opts.file, 'utf-8')
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          process.stderr.write(pc.red(`Error: Could not read file: ${msg}`) + '\n')
          process.exit(ExitCode.VALIDATION_ERROR)
        }
      }

      const body: Record<string, unknown> = {
        title: opts.title,
        collection_id: opts.collection,
      }
      if (content !== undefined) body.content = content
      if (opts.status) body.status = opts.status
      if (opts.excerpt) body.excerpt = opts.excerpt
      if (opts.slug) body.slug = opts.slug

      const client = createClient(global)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Creating article...',
            success: 'Created article',
            fail: 'Failed to create article',
          },
          () => client.request('POST', '/articles', { body }),
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

      const article = data as CreatedArticle
      const urlPart =
        article.number && article.slug
          ? `/articles/${article.number}-${article.slug}`
          : article.number
          ? `/articles/${article.number}`
          : ''

      process.stdout.write(
        pc.green('✓') +
          ` Created article #${article.number} — ${pc.bold(article.title)}` +
          (urlPart ? `\n  ${pc.dim(urlPart)}` : '') +
          '\n'
      )
    })
}

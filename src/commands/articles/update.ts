import { Command } from '@commander-js/extra-typings'
import { readFileSync } from 'fs'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

interface UpdatedArticle {
  number: number
  title?: string
  status?: string
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeArticlesUpdateCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  return new Command('update')
    .description('Update an article')
    .argument('<id>', 'Article ID or number')
    .option('--title <title>', 'New title')
    .option('--content <markdown>', 'New content as markdown')
    .option('--file <path>', 'Path to a markdown file to use as new content')
    .option('--slug <slug>', 'New slug')
    .option('--excerpt <excerpt>', 'New excerpt')
    .option('--seo-title <title>', 'SEO title')
    .option('--seo-description <description>', 'SEO description')
    .option('--publish', 'Publish the article after updating')
    .action(async (id, opts) => {
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

      const body: Record<string, unknown> = {}
      if (opts.title) body.title = opts.title
      if (content !== undefined) body.content = content
      if (opts.slug) body.slug = opts.slug
      if (opts.excerpt) body.excerpt = opts.excerpt
      if (opts.seoTitle) body.seo_title = opts.seoTitle
      if (opts.seoDescription) body.seo_description = opts.seoDescription
      if (opts.publish) body.status = 'published'

      if (Object.keys(body).length === 0) {
        process.stderr.write(
          pc.red('Error: No fields to update. Provide at least one option.') + '\n'
        )
        process.exit(ExitCode.VALIDATION_ERROR)
      }

      const client = createClient(global)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Updating article...',
            success: 'Updated article',
            fail: 'Failed to update article',
          },
          () => client.request('PATCH', `/articles/${id}`, { body }),
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

      const article = data as UpdatedArticle
      const published = opts.publish
      process.stdout.write(
        pc.green('✓') +
          ` ${published ? 'Updated and published' : 'Updated'} article #${article.number}` +
          '\n'
      )
    })
}

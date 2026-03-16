import { Command } from '@commander-js/extra-typings'
import { readFileSync } from 'fs'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

interface Article {
  number: number
  [key: string]: unknown
}

export function makeArticlesContentCommand(globalOpts: () => GlobalOpts): Command {
  const content = new Command('content').description('Manage article content')

  const update = new Command('update')
    .description('Update article content with fine-grained operations')
    .argument('<id>', 'Article ID or number')
    .option(
      '--operation <op>',
      'Content operation (replace_section, insert_after, append)',
      'append'
    )
    .option('--heading <text>', 'Target heading text (for replace_section and insert_after)')
    .option('--heading-level <n>', 'Heading level (1-6)')
    .option('--content <markdown>', 'New content as markdown')
    .option('--file <path>', 'Path to a markdown file to use as content')
    .option('--publish', 'Publish the article after updating content')
    .action(async (id, opts) => {
      const global = globalOpts()

      // Validate: cannot use both --content and --file
      if (opts.content && opts.file) {
        process.stderr.write(
          pc.red('Error: Cannot use both --content and --file. Choose one.') + '\n'
        )
        process.exit(ExitCode.VALIDATION_ERROR)
      }

      // Require at least one content source
      if (!opts.content && !opts.file) {
        process.stderr.write(
          pc.red('Error: One of --content or --file is required.') + '\n'
        )
        process.exit(ExitCode.VALIDATION_ERROR)
      }

      // Read content from file if --file provided
      let contentValue: string | undefined = opts.content
      if (opts.file) {
        try {
          contentValue = readFileSync(opts.file, 'utf-8')
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          process.stderr.write(pc.red(`Error: Could not read file: ${msg}`) + '\n')
          process.exit(ExitCode.VALIDATION_ERROR)
        }
      }

      const body: Record<string, unknown> = {
        operation: opts.operation,
        content: contentValue,
      }
      if (opts.heading) body.heading = opts.heading
      if (opts.headingLevel) body.heading_level = parseInt(opts.headingLevel, 10)
      if (opts.publish) body.publish = true

      const client = createClient(global)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Updating article content...',
            success: 'Updated article content',
            fail: 'Failed to update article content',
          },
          () => client.request('PATCH', `/articles/${id}/content`, { body }),
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
      process.stdout.write(pc.green('✓') + ` Updated content for article #${num}\n`)
    })

  content.addCommand(update)
  return content
}

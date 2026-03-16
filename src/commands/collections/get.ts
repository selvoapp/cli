import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, outputResult, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'
import { renderTable } from '../../lib/table.js'

interface Collection {
  id: string
  name: string
  slug: string
  description?: string
  article_count?: number
  articles?: Array<{ number: number; title: string; status: string }>
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeCollectionsGetCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  return new Command('get')
    .description('Get a collection by ID')
    .argument('<id>', 'Collection ID')
    .action(async (id) => {
      const opts = globalOpts()
      const client = createClient(opts)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Fetching collection...',
            success: 'Fetched collection',
            fail: 'Failed to fetch collection',
          },
          () => client.request('GET', `/collections/${id}`),
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

      // Interactive mode: show collection info + article list table
      const collection = data as Collection
      process.stdout.write(`${pc.bold(collection.name)}\n`)
      if (collection.description) {
        process.stdout.write(`${pc.dim(collection.description)}\n`)
      }
      process.stdout.write(`${pc.dim('Slug:')} ${collection.slug}`)
      if (collection.article_count !== undefined) {
        process.stdout.write(`  ${pc.dim('Articles:')} ${collection.article_count}`)
      }
      process.stdout.write('\n\n')

      if (collection.articles && collection.articles.length > 0) {
        process.stdout.write(
          renderTable(collection.articles as Record<string, unknown>[], [
            { key: 'number', header: 'Number', width: 8 },
            { key: 'title', header: 'Title', width: 40 },
            { key: 'status', header: 'Status', width: 12 },
          ]) + '\n'
        )
      }
    })
}

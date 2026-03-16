import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

interface CreatedCollection {
  id: string
  name: string
  slug?: string
  [key: string]: unknown
}

export function makeCollectionsCreateCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('create')
    .description('Create a new collection')
    .requiredOption('--name <name>', 'Collection name (required)')
    .option('--description <text>', 'Collection description')
    .option('--icon <icon>', 'Collection icon')
    .option('--parent <id>', 'Parent collection ID (creates a subcollection)')
    .action(async (opts) => {
      const global = globalOpts()

      const body: Record<string, unknown> = { name: opts.name }
      if (opts.description) body.description = opts.description
      if (opts.icon) body.icon = opts.icon
      if (opts.parent) body.parent_collection_id = opts.parent

      const client = createClient(global)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Creating collection...',
            success: 'Created collection',
            fail: 'Failed to create collection',
          },
          () => client.request('POST', '/collections', { body }),
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

      const collection = data as CreatedCollection
      process.stdout.write(
        pc.green('✓') + ` Created collection "${pc.bold(collection.name)}"` +
          (collection.slug ? `\n  ${pc.dim('/' + collection.slug)}` : '') +
          '\n'
      )
    })
}

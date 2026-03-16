import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'

interface UpdatedCollection {
  id: string
  name?: string
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeCollectionsUpdateCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  return new Command('update')
    .description('Update a collection')
    .argument('<id>', 'Collection ID')
    .option('--name <name>', 'New name')
    .option('--description <text>', 'New description')
    .option('--icon <icon>', 'New icon')
    .action(async (id, opts) => {
      const global = globalOpts()

      const body: Record<string, unknown> = {}
      if (opts.name) body.name = opts.name
      if (opts.description) body.description = opts.description
      if (opts.icon) body.icon = opts.icon

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
            loading: 'Updating collection...',
            success: 'Updated collection',
            fail: 'Failed to update collection',
          },
          () => client.request('PATCH', `/collections/${id}`, { body }),
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

      const collection = data as UpdatedCollection
      process.stdout.write(
        pc.green('✓') + ` Updated collection "${collection.name ?? id}"\n`
      )
    })
}

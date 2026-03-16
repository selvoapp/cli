import { Command } from '@commander-js/extra-typings'
import type { GlobalOpts } from '../../lib/config.js'
import { runList } from '../../lib/actions.js'

export function makeArticlesListCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('list')
    .description('List articles in your help center')
    .option('--status <status>', 'Filter by status (draft, published, scheduled, archived)')
    .option('--collection <id>', 'Filter by collection ID')
    .action(async (opts) => {
      const global = globalOpts()
      const params: Record<string, string> = {}
      if (opts.status) params.status = opts.status
      if (opts.collection) params.collection_id = opts.collection

      await runList({
        path: '/articles',
        resourceName: 'articles',
        globalOpts: global,
        params,
        columns: [
          { key: 'number', header: 'Number', width: 8 },
          { key: 'title', header: 'Title', width: 40 },
          { key: 'status', header: 'Status', width: 12 },
          { key: 'collection_name', header: 'Collection', width: 20 },
          { key: 'updated_at', header: 'Updated', width: 20 },
        ],
      })
    })
}

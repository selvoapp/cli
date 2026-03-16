import { Command } from '@commander-js/extra-typings'
import type { GlobalOpts } from '../../lib/config.js'
import { runList } from '../../lib/actions.js'

export function makeCollectionsListCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('list')
    .description('List collections in your help center')
    .action(async () => {
      const global = globalOpts()

      await runList({
        path: '/collections',
        resourceName: 'collections',
        globalOpts: global,
        columns: [
          { key: 'id', header: 'ID', width: 28 },
          { key: 'name', header: 'Name', width: 30 },
          { key: 'slug', header: 'Slug', width: 24 },
          { key: 'article_count', header: 'Articles', width: 10 },
          { key: 'subcollection_count', header: 'Subcollections', width: 16 },
        ],
      })
    })
}

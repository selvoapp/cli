import { Command } from '@commander-js/extra-typings'
import type { GlobalOpts } from '../../lib/config.js'
import { runList } from '../../lib/actions.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeArticlesSearchCommand(globalOpts: () => GlobalOpts): Command<any, any, any> {
  return new Command('search')
    .description('Search articles by query')
    .argument('<query>', 'Search query')
    .option('--limit <n>', 'Maximum number of results', '10')
    .action(async (query, opts) => {
      const global = globalOpts()
      const params: Record<string, string> = {
        query,
        limit: opts.limit,
      }

      await runList({
        path: '/articles/search',
        resourceName: 'articles',
        globalOpts: global,
        params,
        columns: [
          { key: 'number', header: 'Number', width: 8 },
          { key: 'title', header: 'Title', width: 50 },
          { key: 'status', header: 'Status', width: 12 },
          { key: 'updated_at', header: 'Updated', width: 20 },
        ],
      })
    })
}

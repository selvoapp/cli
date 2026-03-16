import { Command } from '@commander-js/extra-typings'
import type { GlobalOpts } from '../../lib/config.js'
import { runList } from '../../lib/actions.js'

export function makeDomainsListCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('list')
    .description('List custom domains for your help center')
    .action(async () => {
      const global = globalOpts()

      await runList({
        path: '/domains',
        resourceName: 'domains',
        globalOpts: global,
        columns: [
          { key: 'id', header: 'ID', width: 28 },
          { key: 'hostname', header: 'Domain', width: 36 },
          { key: 'verified', header: 'Verified', width: 10 },
        ],
      })
    })
}

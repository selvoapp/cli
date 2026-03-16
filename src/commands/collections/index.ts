import { Command } from '@commander-js/extra-typings'
import type { GlobalOpts } from '../../lib/config.js'
import { makeCollectionsListCommand } from './list.js'
import { makeCollectionsGetCommand } from './get.js'
import { makeCollectionsCreateCommand } from './create.js'
import { makeCollectionsUpdateCommand } from './update.js'
import { makeCollectionsDeleteCommand } from './delete.js'
import { makeCollectionsReorderCommand } from './reorder.js'

export function makeCollectionsCommand(globalOpts: () => GlobalOpts): Command {
  const collections = new Command('collections').description(
    'Manage collections in your help center'
  )

  collections.addCommand(makeCollectionsListCommand(globalOpts))
  collections.addCommand(makeCollectionsGetCommand(globalOpts))
  collections.addCommand(makeCollectionsCreateCommand(globalOpts))
  collections.addCommand(makeCollectionsUpdateCommand(globalOpts))
  collections.addCommand(makeCollectionsDeleteCommand(globalOpts))
  collections.addCommand(makeCollectionsReorderCommand(globalOpts))

  return collections
}

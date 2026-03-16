import { Command } from '@commander-js/extra-typings'
import type { GlobalOpts } from '../../lib/config.js'
import { makeMessagesListCommand } from './list.js'
import { makeMessagesGetCommand } from './get.js'
import { makeMessagesReadCommand } from './read.js'
import { makeMessagesDeleteCommand } from './delete.js'

export function makeMessagesCommand(globalOpts: () => GlobalOpts): Command {
  const messages = new Command('messages').description(
    'Manage contact messages from your help center'
  )

  messages.addCommand(makeMessagesListCommand(globalOpts))
  messages.addCommand(makeMessagesGetCommand(globalOpts))
  messages.addCommand(makeMessagesReadCommand(globalOpts))
  messages.addCommand(makeMessagesDeleteCommand(globalOpts))

  return messages
}

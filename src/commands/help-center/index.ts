import { Command } from '@commander-js/extra-typings'
import type { GlobalOpts } from '../../lib/config.js'
import { makeHelpCenterGetCommand } from './get.js'
import { makeHelpCenterUpdateCommand } from './update.js'

export function makeHelpCenterCommand(globalOpts: () => GlobalOpts): Command {
  const helpCenter = new Command('help-center').description(
    'View and update your help center settings'
  )

  helpCenter.addCommand(makeHelpCenterGetCommand(globalOpts))
  helpCenter.addCommand(makeHelpCenterUpdateCommand(globalOpts))

  return helpCenter
}

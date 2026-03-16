import { Command } from '@commander-js/extra-typings'
import type { GlobalOpts } from '../../lib/config.js'
import { makeLoginCommand } from './login.js'
import { makeLogoutCommand } from './logout.js'
import { makeAuthListCommand } from './list.js'
import { makeAuthSwitchCommand } from './switch.js'

export function makeAuthCommand(globalOpts: () => GlobalOpts): Command {
  const auth = new Command('auth').description('Manage authentication profiles')

  auth.addCommand(makeLoginCommand(globalOpts))
  auth.addCommand(makeLogoutCommand(globalOpts))
  auth.addCommand(makeAuthListCommand(globalOpts))
  auth.addCommand(makeAuthSwitchCommand(globalOpts))

  return auth
}

import { Command } from '@commander-js/extra-typings'
import type { GlobalOpts } from '../../lib/config.js'
import { makeDomainsListCommand } from './list.js'
import { makeDomainsCreateCommand } from './create.js'
import { makeDomainsDeleteCommand } from './delete.js'
import { makeDomainsVerifyCommand } from './verify.js'

export function makeDomainsCommand(globalOpts: () => GlobalOpts): Command {
  const domains = new Command('domains').description('Manage custom domains for your help center')

  domains.addCommand(makeDomainsListCommand(globalOpts))
  domains.addCommand(makeDomainsCreateCommand(globalOpts))
  domains.addCommand(makeDomainsDeleteCommand(globalOpts))
  domains.addCommand(makeDomainsVerifyCommand(globalOpts))

  return domains
}

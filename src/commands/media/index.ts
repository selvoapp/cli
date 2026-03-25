import { Command } from '@commander-js/extra-typings'
import type { GlobalOpts } from '../../lib/config.js'
import { makeMediaUploadCommand } from './upload.js'

export function makeMediaCommand(globalOpts: () => GlobalOpts): Command {
  const cmd = new Command('media').description('Manage media uploads')

  cmd.addCommand(makeMediaUploadCommand(globalOpts))

  return cmd
}

import { Command } from '@commander-js/extra-typings'
import { VERSION, CLI_NAME } from './lib/constants.js'
import type { GlobalOpts } from './lib/config.js'
import { makeAuthCommand } from './commands/auth/index.js'
import { makeLoginCommand } from './commands/auth/login.js'
import { makeLogoutCommand } from './commands/auth/logout.js'
import { makeWhoamiCommand } from './commands/whoami.js'
import { makeDoctorCommand } from './commands/doctor.js'
import { makeArticlesCommand } from './commands/articles/index.js'
import { makeCollectionsCommand } from './commands/collections/index.js'
import { makeHelpCenterCommand } from './commands/help-center/index.js'
import { makeDomainsCommand } from './commands/domains/index.js'
import { makeAnalyticsCommand } from './commands/analytics/index.js'
import { makeMessagesCommand } from './commands/messages/index.js'

const program = new Command()
  .name(CLI_NAME)
  .version(VERSION, '-v, --version', 'Output the current version')
  .description('Manage your Selvo help center from the terminal')
  .addHelpText(
    'after',
    `
Examples:
  selvo login                        Authenticate with your API key
  selvo whoami                       Show current profile and help center
  selvo doctor                       Run diagnostic checks
  selvo articles list                List all articles
  selvo articles create --title "..."  Create an article
  selvo collections list             List all collections
  selvo help-center get              Show help center info
`
  )
  .option('--api-key <key>', 'Override API key for this request')
  .option('-p, --profile <name>', 'Select credentials profile')
  .option('--json', 'Force JSON output (machine-readable)')
  .option('-q, --quiet', 'Suppress all stderr output, implies --json')
  .option('--base-url <url>', 'Override API base URL')

// Helper to read global opts from the root program at action time.
// Using a type assertion because extra-typings infers opts at compile-time
// from the fluent chain, but we add options before this function is called.
function getGlobalOpts(): GlobalOpts {
  const opts = program.opts() as {
    apiKey?: string
    profile?: string
    json?: boolean
    quiet?: boolean
    baseUrl?: string
  }
  return {
    apiKey: opts.apiKey,
    profile: opts.profile,
    json: opts.json,
    quiet: opts.quiet,
    baseUrl: opts.baseUrl,
  }
}

// Auth command group: selvo auth login / logout / list / switch
program.addCommand(makeAuthCommand(getGlobalOpts))

// Top-level aliases: selvo login / selvo logout
program.addCommand(makeLoginCommand(getGlobalOpts))
program.addCommand(makeLogoutCommand(getGlobalOpts))

// Utility commands
program.addCommand(makeWhoamiCommand(getGlobalOpts))
program.addCommand(makeDoctorCommand(getGlobalOpts))

// Articles command group
program.addCommand(makeArticlesCommand(getGlobalOpts))

// Collections command group
program.addCommand(makeCollectionsCommand(getGlobalOpts))

// Help Center command group
program.addCommand(makeHelpCenterCommand(getGlobalOpts))

// Domains command group
program.addCommand(makeDomainsCommand(getGlobalOpts))

// Analytics command group
program.addCommand(makeAnalyticsCommand(getGlobalOpts))

// Messages command group
program.addCommand(makeMessagesCommand(getGlobalOpts))

program.parse(process.argv)

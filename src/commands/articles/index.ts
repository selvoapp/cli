import { Command } from '@commander-js/extra-typings'
import type { GlobalOpts } from '../../lib/config.js'
import { makeArticlesListCommand } from './list.js'
import { makeArticlesGetCommand } from './get.js'
import { makeArticlesCreateCommand } from './create.js'
import { makeArticlesUpdateCommand } from './update.js'
import { makeArticlesDeleteCommand } from './delete.js'
import { makeArticlesPublishCommand } from './publish.js'
import { makeArticlesUnpublishCommand } from './unpublish.js'
import { makeArticlesMoveCommand } from './move.js'
import { makeArticlesSearchCommand } from './search.js'
import { makeArticlesReorderCommand } from './reorder.js'
import { makeArticlesContentCommand } from './content.js'

export function makeArticlesCommand(globalOpts: () => GlobalOpts): Command {
  const articles = new Command('articles').description('Manage articles in your help center')

  articles.addCommand(makeArticlesListCommand(globalOpts))
  articles.addCommand(makeArticlesGetCommand(globalOpts))
  articles.addCommand(makeArticlesCreateCommand(globalOpts))
  articles.addCommand(makeArticlesUpdateCommand(globalOpts))
  articles.addCommand(makeArticlesDeleteCommand(globalOpts))
  articles.addCommand(makeArticlesPublishCommand(globalOpts))
  articles.addCommand(makeArticlesUnpublishCommand(globalOpts))
  articles.addCommand(makeArticlesMoveCommand(globalOpts))
  articles.addCommand(makeArticlesSearchCommand(globalOpts))
  articles.addCommand(makeArticlesReorderCommand(globalOpts))
  articles.addCommand(makeArticlesContentCommand(globalOpts))

  return articles
}

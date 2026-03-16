import { Command } from '@commander-js/extra-typings'
import type { GlobalOpts } from '../../lib/config.js'
import { makeAnalyticsOverviewCommand } from './overview.js'
import { makeAnalyticsVisitsCommand } from './visits.js'
import { makeAnalyticsArticlesCommand } from './articles.js'
import { makeAnalyticsSearchCommand } from './search.js'
import { makeAnalyticsFeedbackCommand } from './feedback.js'

export function makeAnalyticsCommand(globalOpts: () => GlobalOpts): Command {
  const analytics = new Command('analytics').description(
    'View analytics for your help center'
  )

  analytics.addCommand(makeAnalyticsOverviewCommand(globalOpts))
  analytics.addCommand(makeAnalyticsVisitsCommand(globalOpts))
  analytics.addCommand(makeAnalyticsArticlesCommand(globalOpts))
  analytics.addCommand(makeAnalyticsSearchCommand(globalOpts))
  analytics.addCommand(makeAnalyticsFeedbackCommand(globalOpts))

  return analytics
}

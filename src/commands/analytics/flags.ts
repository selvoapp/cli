import type { Command } from '@commander-js/extra-typings'

/**
 * Adds shared period flags to an analytics command.
 * --period 7d|30d|90d (default 30d)
 * --from YYYY-MM-DD
 * --to YYYY-MM-DD
 */
export function addPeriodFlags(cmd: Command): void {
  cmd
    .option('--period <range>', 'Time period: 7d, 30d, or 90d', '30d')
    .option('--from <date>', 'Start date (YYYY-MM-DD), overrides --period')
    .option('--to <date>', 'End date (YYYY-MM-DD), overrides --period')
}

/**
 * Builds the query params object from period flag values.
 */
export function buildPeriodParams(opts: {
  period?: string
  from?: string
  to?: string
}): Record<string, string> {
  const params: Record<string, string> = {}
  if (opts.from) params.from = opts.from
  if (opts.to) params.to = opts.to
  if (!opts.from && !opts.to && opts.period) params.range = opts.period
  return params
}

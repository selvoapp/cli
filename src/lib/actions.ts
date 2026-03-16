import { createClient } from './client.js'
import type { GlobalOpts } from './config.js'
import { withSpinner } from './spinner.js'
import { outputResult, outputError, shouldOutputJson, ExitCode } from './output.js'
import { renderTable } from './table.js'
import type { TableColumn } from './table.js'

/**
 * Shared action: fetch and display a single resource.
 */
export async function runGet(opts: {
  path: string
  resourceName: string
  globalOpts: GlobalOpts
  transform?: (data: unknown) => unknown
}): Promise<void> {
  const client = createClient(opts.globalOpts)

  let data: unknown
  try {
    data = await withSpinner(
      {
        loading: `Fetching ${opts.resourceName}...`,
        success: `Fetched ${opts.resourceName}`,
        fail: `Failed to fetch ${opts.resourceName}`,
      },
      () => client.request('GET', opts.path),
      opts.globalOpts
    )
  } catch (err) {
    const error = err as { code: string; message: string }
    outputError(error, opts.globalOpts)
    if (error.code === 'NETWORK_ERROR' || error.code?.startsWith('HTTP_4')) {
      process.exit(ExitCode.AUTH_ERROR)
    }
    process.exit(ExitCode.API_ERROR)
  }

  const result = opts.transform ? opts.transform(data) : data
  outputResult(result, opts.globalOpts)
}

/**
 * Shared action: fetch and display a list of resources.
 */
export async function runList(opts: {
  path: string
  resourceName: string
  globalOpts: GlobalOpts
  params?: Record<string, string>
  columns?: TableColumn[]
}): Promise<void> {
  const client = createClient(opts.globalOpts)

  let data: unknown
  try {
    data = await withSpinner(
      {
        loading: `Fetching ${opts.resourceName}...`,
        success: `Fetched ${opts.resourceName}`,
        fail: `Failed to fetch ${opts.resourceName}`,
      },
      () => client.request('GET', opts.path, { params: opts.params }),
      opts.globalOpts
    )
  } catch (err) {
    const error = err as { code: string; message: string }
    outputError(error, opts.globalOpts)
    process.exit(ExitCode.API_ERROR)
  }

  if (shouldOutputJson(opts.globalOpts)) {
    outputResult(data, opts.globalOpts)
    return
  }

  // Interactive table output
  if (opts.columns && Array.isArray(data)) {
    const rows = data as Record<string, unknown>[]
    if (rows.length === 0) {
      process.stdout.write(`No ${opts.resourceName} found.\n`)
      return
    }
    process.stdout.write(renderTable(rows, opts.columns) + '\n')
  } else {
    outputResult(data, opts.globalOpts)
  }
}

/**
 * Shared action: create a resource.
 */
export async function runCreate(opts: {
  path: string
  resourceName: string
  body: unknown
  globalOpts: GlobalOpts
}): Promise<void> {
  const client = createClient(opts.globalOpts)

  let data: unknown
  try {
    data = await withSpinner(
      {
        loading: `Creating ${opts.resourceName}...`,
        success: `Created ${opts.resourceName}`,
        fail: `Failed to create ${opts.resourceName}`,
      },
      () => client.request('POST', opts.path, { body: opts.body }),
      opts.globalOpts
    )
  } catch (err) {
    const error = err as { code: string; message: string }
    outputError(error, opts.globalOpts)
    process.exit(ExitCode.API_ERROR)
  }

  outputResult(data, opts.globalOpts)
}

/**
 * Shared action: update a resource.
 */
export async function runUpdate(opts: {
  path: string
  resourceName: string
  body: unknown
  globalOpts: GlobalOpts
}): Promise<void> {
  const client = createClient(opts.globalOpts)

  let data: unknown
  try {
    data = await withSpinner(
      {
        loading: `Updating ${opts.resourceName}...`,
        success: `Updated ${opts.resourceName}`,
        fail: `Failed to update ${opts.resourceName}`,
      },
      () => client.request('PATCH', opts.path, { body: opts.body }),
      opts.globalOpts
    )
  } catch (err) {
    const error = err as { code: string; message: string }
    outputError(error, opts.globalOpts)
    process.exit(ExitCode.API_ERROR)
  }

  outputResult(data, opts.globalOpts)
}

/**
 * Shared action: delete a resource.
 * In interactive mode, prompts for confirmation unless skipConfirm is true.
 */
export async function runDelete(opts: {
  path: string
  resourceName: string
  globalOpts: GlobalOpts
  skipConfirm?: boolean
}): Promise<void> {
  const client = createClient(opts.globalOpts)

  // Confirm in interactive mode
  if (!opts.skipConfirm && !shouldOutputJson(opts.globalOpts)) {
    const { confirm } = await import('@clack/prompts')
    const confirmed = await confirm({
      message: `Are you sure you want to delete this ${opts.resourceName}? This cannot be undone.`,
    })
    if (!confirmed) {
      process.stdout.write('Cancelled.\n')
      return
    }
  }

  let data: unknown
  try {
    data = await withSpinner(
      {
        loading: `Deleting ${opts.resourceName}...`,
        success: `Deleted ${opts.resourceName}`,
        fail: `Failed to delete ${opts.resourceName}`,
      },
      () => client.request('DELETE', opts.path),
      opts.globalOpts
    )
  } catch (err) {
    const error = err as { code: string; message: string }
    outputError(error, opts.globalOpts)
    process.exit(ExitCode.API_ERROR)
  }

  outputResult(data, opts.globalOpts)
}

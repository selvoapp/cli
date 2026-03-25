import { Command } from '@commander-js/extra-typings'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { readFileSync, writeFileSync } from 'fs'
import pc from 'picocolors'
import { createClient } from '../../lib/client.js'
import type { GlobalOpts } from '../../lib/config.js'
import { resolveApiKey, resolveBaseUrl } from '../../lib/config.js'
import { shouldOutputJson, outputError, ExitCode } from '../../lib/output.js'
import { withSpinner } from '../../lib/spinner.js'
import { findLocalImages, replaceImageUrls } from '../../lib/markdown-images.js'
import { uploadFile } from '../../lib/upload.js'

interface CreatedArticle {
  number: number
  title: string
  slug?: string
  [key: string]: unknown
}

export function makeArticlesCreateCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('create')
    .description('Create a new article')
    .requiredOption('--title <title>', 'Article title (required)')
    .requiredOption('--collection <id>', 'Collection ID (required)')
    .option('--content <markdown>', 'Article content as markdown')
    .option('--file <path>', 'Path to a markdown file to use as content')
    .option('--status <status>', 'Initial status (draft, published)')
    .option('--excerpt <text>', 'Article excerpt')
    .option('--slug <slug>', 'Article slug (auto-generated from title if omitted)')
    .option('--no-writeback', 'Do not write uploaded URLs back to the source file')
    .action(async (opts) => {
      const global = globalOpts()

      // Validate: cannot use both --content and --file
      if (opts.content && opts.file) {
        process.stderr.write(
          pc.red('Error: Cannot use both --content and --file. Choose one.') + '\n'
        )
        process.exit(ExitCode.VALIDATION_ERROR)
      }

      // Read content from file if --file provided
      let content: string | undefined = opts.content
      if (opts.file) {
        try {
          content = readFileSync(opts.file, 'utf-8')
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          process.stderr.write(pc.red(`Error: Could not read file: ${msg}`) + '\n')
          process.exit(ExitCode.VALIDATION_ERROR)
        }
      }

      // Auto-upload local images
      let uploads: Array<{ localPath: string; url: string }> = []
      if (opts.file && content) {
        const baseDir = path.resolve(path.dirname(opts.file))
        const localImages = findLocalImages(content, baseDir)

        if (localImages.length > 0) {
          const apiKey = resolveApiKey(global)
          const baseUrl = resolveBaseUrl(global)
          if (!apiKey) {
            process.stderr.write(
              pc.red('Error: No API key found. Run `selvo login` first.') + '\n'
            )
            process.exit(ExitCode.VALIDATION_ERROR)
          }

          // Validate all local files exist before uploading any
          for (const img of localImages) {
            if (!fs.existsSync(img.resolvedPath)) {
              process.stderr.write(
                pc.red(`Error: Local image not found: ${img.localPath}`) + '\n'
              )
              process.exit(ExitCode.VALIDATION_ERROR)
            }
          }

          const replacements = new Map<string, string>()

          if (!shouldOutputJson(global)) {
            process.stderr.write(
              `Uploading ${localImages.length} image${localImages.length > 1 ? 's' : ''}...\n`
            )
          }

          for (const img of localImages) {
            if (replacements.has(img.localPath)) continue // skip duplicates
            try {
              const result = await uploadFile({
                apiKey,
                baseUrl,
                filePath: img.resolvedPath,
                category: 'article-image',
              })
              replacements.set(img.localPath, result.url)
              uploads.push({ localPath: img.localPath, url: result.url })
              if (!shouldOutputJson(global)) {
                process.stderr.write(
                  pc.green('  ✓') + ` ${img.localPath} → ${pc.dim(result.url)}\n`
                )
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err)
              process.stderr.write(pc.red(`Error uploading ${img.localPath}: ${msg}`) + '\n')
              process.exit(ExitCode.API_ERROR)
            }
          }

          // Replace local paths with URLs in content
          content = replaceImageUrls(content, replacements)

          // Write back to source file (unless --no-writeback)
          if (opts.writeback !== false) {
            try {
              writeFileSync(opts.file, content, 'utf-8')
              if (!shouldOutputJson(global)) {
                process.stderr.write(pc.green('  ✓') + ` Updated ${opts.file} with remote URLs\n`)
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err)
              process.stderr.write(
                pc.yellow(`Warning: Could not write back to ${opts.file}: ${msg}`) + '\n'
              )
            }
          }
        }
      }

      const body: Record<string, unknown> = {
        title: opts.title,
        collection_id: opts.collection,
      }
      if (content !== undefined) body.content = content
      if (opts.status) body.status = opts.status
      if (opts.excerpt) body.excerpt = opts.excerpt
      if (opts.slug) body.slug = opts.slug

      const client = createClient(global)

      let data: unknown
      try {
        data = await withSpinner(
          {
            loading: 'Creating article...',
            success: 'Created article',
            fail: 'Failed to create article',
          },
          () => client.request('POST', '/articles', { body }),
          global
        )
      } catch (err) {
        const error = err as { code: string; message: string }
        outputError(error, global)
        process.exit(ExitCode.API_ERROR)
      }

      if (shouldOutputJson(global)) {
        const output = uploads.length > 0 ? { ...(data as object), uploads } : data
        process.stdout.write(JSON.stringify(output, null, 2) + '\n')
        return
      }

      const article = data as CreatedArticle
      const urlPart =
        article.number && article.slug
          ? `/articles/${article.number}-${article.slug}`
          : article.number
          ? `/articles/${article.number}`
          : ''

      process.stdout.write(
        pc.green('✓') +
          ` Created article #${article.number} — ${pc.bold(article.title)}` +
          (urlPart ? `\n  ${pc.dim(urlPart)}` : '') +
          '\n'
      )
    })
}

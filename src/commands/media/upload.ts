import * as fs from 'node:fs'
import * as path from 'node:path'
import { Command } from '@commander-js/extra-typings'
import pc from 'picocolors'
import { resolveApiKey, resolveBaseUrl } from '../../lib/config.js'
import type { GlobalOpts } from '../../lib/config.js'
import { shouldOutputJson, outputError, ExitCode } from '../../lib/output.js'
import { getMimeType, uploadFile } from '../../lib/upload.js'
import type { UploadResult } from '../../lib/upload.js'
import { isInteractive } from '../../lib/tty.js'

export function makeMediaUploadCommand(globalOpts: () => GlobalOpts): Command {
  return new Command('upload')
    .description('Upload a media file')
    .argument('<file>', 'Path to the file to upload')
    .option('--category <category>', 'Upload category (default: article-image)')
    .action(async (file, opts) => {
      const global = globalOpts()

      // Validate: file exists
      const resolvedPath = path.resolve(file)
      if (!fs.existsSync(resolvedPath)) {
        process.stderr.write(pc.red(`Error: File not found: ${file}`) + '\n')
        process.exit(ExitCode.VALIDATION_ERROR)
      }

      // Validate: recognized extension
      const mimeType = getMimeType(resolvedPath)
      if (!mimeType) {
        process.stderr.write(
          pc.red(`Error: Unsupported file type: ${path.extname(file)}`) + '\n'
        )
        process.exit(ExitCode.VALIDATION_ERROR)
      }

      // Resolve auth
      const apiKey = resolveApiKey(global)
      if (!apiKey) {
        process.stderr.write(
          'Error: No API key found. Run `selvo login` or set SELVO_API_KEY.\n'
        )
        process.exit(ExitCode.AUTH_ERROR)
      }
      const baseUrl = resolveBaseUrl(global)

      // Determine category
      const category = opts.category ?? 'article-image'

      const quiet = shouldOutputJson(global)
      const interactive = isInteractive() && !quiet

      // Show spinner while uploading
      const BRAILLE_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
      const FRAME_INTERVAL_MS = 80
      let frameIndex = 0
      let timer: ReturnType<typeof setInterval> | undefined

      if (interactive) {
        process.stderr.write(`${BRAILLE_FRAMES[0]} Uploading ${path.basename(file)}...`)
        timer = setInterval(() => {
          frameIndex = (frameIndex + 1) % BRAILLE_FRAMES.length
          process.stderr.write(
            `\r${BRAILLE_FRAMES[frameIndex]} Uploading ${path.basename(file)}...`
          )
        }, FRAME_INTERVAL_MS)
      }

      let result: UploadResult
      try {
        result = await uploadFile({
          apiKey,
          baseUrl,
          filePath: resolvedPath,
          category,
        })
      } catch (err) {
        if (timer) clearInterval(timer)
        if (interactive) {
          process.stderr.write(`\r${pc.red('✗')} Upload failed\n`)
        }
        const message = err instanceof Error ? err.message : String(err)
        outputError({ code: 'UPLOAD_ERROR', message }, global)
        process.exit(ExitCode.API_ERROR)
      }

      if (timer) clearInterval(timer)
      if (interactive) {
        process.stderr.write(`\r${pc.green('✓')} Uploaded ${path.basename(file)}\n`)
      }

      if (shouldOutputJson(global)) {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n')
        return
      }

      process.stdout.write(
        pc.green('✓') +
          ` Uploaded ${pc.bold(result.filename)} ${pc.dim('->')} ${result.url}\n`
      )
    })
}

import * as path from 'node:path'
import { getMimeType } from './upload.js'

export interface LocalImage {
  fullMatch: string // The full ![alt](path) match
  alt: string // Alt text
  localPath: string // Path as written in markdown
  resolvedPath: string // Absolute path resolved from baseDir
}

/**
 * Find all local image references in markdown.
 * Only matches ![alt](path) where path is NOT a URL (http/https)
 * and has a recognized image extension.
 */
export function findLocalImages(markdown: string, baseDir: string): LocalImage[] {
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g
  const results: LocalImage[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(markdown)) !== null) {
    const [fullMatch, alt, rawPath] = match

    // Skip URLs
    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) continue

    // Skip data URIs
    if (rawPath.startsWith('data:')) continue

    // Check if it's a recognized image type
    const resolved = path.resolve(baseDir, rawPath)
    if (!getMimeType(resolved)) continue

    results.push({
      fullMatch,
      alt,
      localPath: rawPath,
      resolvedPath: resolved,
    })
  }

  return results
}

/**
 * Replace local image paths with uploaded URLs in markdown.
 * Returns the modified markdown string.
 */
export function replaceImageUrls(markdown: string, replacements: Map<string, string>): string {
  let result = markdown
  for (const [localPath, url] of replacements) {
    // Replace all occurrences of this local path (same image may be used multiple times)
    result = result.split(localPath).join(url)
  }
  return result
}

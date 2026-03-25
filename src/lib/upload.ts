import * as fs from 'node:fs'
import * as path from 'node:path'

export interface UploadResult {
  url: string
  filename: string
  content_type: string
  size: number
}

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

export function getMimeType(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_MAP[ext] ?? null
}

export async function uploadFile(opts: {
  apiKey: string
  baseUrl: string
  filePath: string
  category?: string
  entityId?: string
}): Promise<UploadResult> {
  const { apiKey, baseUrl, filePath, category = 'article-image', entityId } = opts

  // Read file
  const buffer = fs.readFileSync(filePath)
  const filename = path.basename(filePath)
  const mimeType = getMimeType(filePath)
  if (!mimeType) {
    throw new Error(`Unsupported file type: ${path.extname(filePath)}`)
  }

  // Build FormData (Node 20+ native)
  const formData = new FormData()
  formData.append('file', new Blob([buffer], { type: mimeType }), filename)
  formData.append('category', category)
  if (entityId) {
    formData.append('entity_id', entityId)
  }

  // POST to API — do NOT set Content-Type manually (let fetch set multipart boundary)
  const res = await fetch(`${baseUrl}/api/v1/media/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message =
      (body as { error?: { message?: string } })?.error?.message ??
      `Upload failed with status ${res.status}`
    throw new Error(message)
  }

  const { data } = (await res.json()) as { data: UploadResult }
  return data
}

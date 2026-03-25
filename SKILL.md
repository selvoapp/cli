---
name: selvo
version: 0.1.0
description: "Selvo CLI: Manage help center articles, collections, domains, analytics, and messages."
metadata:
  openclaw:
    category: "productivity"
    requires:
      bins: ["selvo"]
    cliHelp: "selvo --help"
---

# selvo — CLI Reference for AI Agents

## Installation

```bash
npm install -g @selvo/cli
```

The `selvo` binary must be on `$PATH`. Requires Node.js 20+.

## Authentication

```bash
# Interactive login (prompts for API key)
selvo login

# Non-interactive login
selvo login --key sk_xxx

# With custom base URL (staging/dev)
selvo login --key sk_xxx --base-url http://localhost:3000

# Check current auth
selvo whoami

# Run diagnostic checks
selvo doctor
```

API keys are created in the Selvo dashboard under Settings > API Keys.

Credentials are stored in `~/.config/selvo/credentials.json`.

### Multi-Profile

```bash
selvo auth list                    # List all profiles
selvo auth switch <profile>        # Switch active profile
selvo logout                       # Remove active profile
```

### Key Resolution Order

1. `--api-key <key>` flag (highest priority)
2. `SELVO_API_KEY` environment variable
3. Credentials file (active profile)

## Global Flags

| Flag | Description |
|------|-------------|
| `--api-key <key>` | Override API key for this request |
| `-p, --profile <name>` | Select credentials profile |
| `--json` | Force JSON output (machine-readable) |
| `-q, --quiet` | Suppress stderr, implies --json |
| `--base-url <url>` | Override API base URL |

## Output Modes

- **Interactive (TTY):** Tables, spinners, colors
- **JSON (`--json` or piped):** Structured JSON to stdout, no spinners
- **Quiet (`-q`):** JSON only, no stderr at all — best for scripts and CI

When piping output (e.g., `selvo articles list | jq`), JSON mode is automatic.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | API error (4xx/5xx from server) |
| 2 | Auth error (no key, invalid key) |
| 3 | Validation error (missing required argument) |

## Security Rules

- **Never** output raw API keys — the CLI always masks them (e.g., `sk_rRk...Etfw`)
- **Always** confirm with user before executing `delete` commands
- Use `--quiet` to skip confirmation prompts in scripts

---

## Articles

### List articles

```bash
selvo articles list
selvo articles list --status published
selvo articles list --status draft --collection col_xxx
```

| Flag | Description |
|------|-------------|
| `--status <status>` | Filter: `draft`, `published`, `scheduled`, `archived` |
| `--collection <id>` | Filter by collection ID |

### Get article

```bash
selvo articles get <id>
selvo articles get 12              # By article number
selvo articles get art_xxx         # By article ID
```

Returns markdown content in interactive mode, full JSON with `--json`.

### Create article

```bash
selvo articles create --title "Getting Started" --collection col_xxx
selvo articles create --title "Install Guide" --collection col_xxx --file ./guide.md
selvo articles create --title "FAQ" --collection col_xxx --content "## Question\n\nAnswer." --status published
```

| Flag | Required | Description |
|------|----------|-------------|
| `--title <title>` | Yes | Article title |
| `--collection <id>` | Yes | Collection ID |
| `--content <markdown>` | No | Inline markdown content |
| `--file <path>` | No | Read markdown from file. Local images auto-uploaded (see Media section) |
| `--status <status>` | No | `draft` (default) or `published` |
| `--excerpt <text>` | No | Short summary for listings and SEO |
| `--slug <slug>` | No | URL slug (auto-generated from title if omitted) |
| `--no-writeback` | No | Skip writing uploaded URLs back to the source file |

### Update article

```bash
selvo articles update <id> --title "New Title"
selvo articles update <id> --file ./updated.md --publish
selvo articles update <id> --excerpt "Updated summary" --seo-title "SEO Override"
```

| Flag | Description |
|------|-------------|
| `--title <title>` | New title |
| `--content <markdown>` | New content (replaces entire body) |
| `--file <path>` | Read new content from file. Local images auto-uploaded (see Media section) |
| `--slug <slug>` | New URL slug |
| `--excerpt <text>` | New excerpt |
| `--seo-title <title>` | SEO title override |
| `--seo-description <desc>` | SEO meta description |
| `--publish` | Publish immediately after updating |
| `--no-writeback` | Skip writing uploaded URLs back to the source file |

### Surgical content update

Update a specific section without replacing the entire article:

```bash
# Append a section to the end
selvo articles content update <id> --operation append --content "## New Section\n\nContent here."

# Replace content under a heading
selvo articles content update <id> --operation replace_section --heading "FAQ" --content "## FAQ\n\nNew FAQ content."

# Insert after a heading
selvo articles content update <id> --operation insert_after --heading "Step 1" --file ./step1-details.md

# Update and publish
selvo articles content update <id> --operation append --content "## Changelog" --publish
```

| Flag | Required | Description |
|------|----------|-------------|
| `--operation <op>` | Yes | `replace_section`, `insert_after`, or `append` |
| `--heading <text>` | For replace/insert | Exact heading text to target |
| `--heading-level <n>` | No | Heading level (1-6) to disambiguate |
| `--content <markdown>` | Yes* | New markdown content |
| `--file <path>` | Yes* | Read content from file |
| `--publish` | No | Publish after updating |

*Provide either `--content` or `--file`.

### Publish / Unpublish

```bash
selvo articles publish <id>
selvo articles unpublish <id>
```

### Move article

```bash
selvo articles move <id> --collection col_yyy
```

### Search articles

```bash
selvo articles search "install widget"
selvo articles search "getting started" --limit 5
```

### Delete article

```bash
selvo articles delete <id>
selvo articles delete <id> --quiet    # Skip confirmation
```

> [!CAUTION]
> This is a **destructive** command — confirm with the user before executing.

### Reorder articles

```bash
selvo articles reorder --ids art_xxx,art_yyy,art_zzz
```

IDs are listed in the desired display order.

---

## Collections

### List collections

```bash
selvo collections list
```

Returns a tree with subcollections and article counts.

### Get collection

```bash
selvo collections get <id>
selvo collections get col_xxx
```

Returns collection details and its articles.

### Create collection

```bash
selvo collections create --name "Getting Started"
selvo collections create --name "API Reference" --description "Technical docs" --icon "lucide:code"
selvo collections create --name "Authentication" --parent col_xxx    # Subcollection
```

| Flag | Required | Description |
|------|----------|-------------|
| `--name <name>` | Yes | Collection name |
| `--description <text>` | No | Description shown on collection page |
| `--icon <icon>` | No | Icon: `lucide:icon-name` format or emoji |
| `--parent <id>` | No | Parent collection ID (creates subcollection) |

### Update collection

```bash
selvo collections update <id> --name "New Name"
selvo collections update <id> --description "Updated description" --icon "lucide:rocket"
```

### Delete collection

```bash
selvo collections delete <id>
selvo collections delete <id> --quiet
```

> [!CAUTION]
> This is a **destructive** command — confirm with the user before executing.

### Reorder collections

```bash
selvo collections reorder --ids col_xxx,col_yyy,col_zzz
```

---

## Help Center

### Get help center info

```bash
selvo help-center get
```

Returns name, subdomain, URL, settings, and domains.

### Update help center

```bash
selvo help-center update --name "New Name"
selvo help-center update --subdomain "new-subdomain"
```

---

## Domains

### List domains

```bash
selvo domains list
```

### Add custom domain

```bash
selvo domains create --hostname help.example.com
```

### Verify domain

```bash
selvo domains verify <id>
```

### Remove domain

```bash
selvo domains delete <id>
```

> [!CAUTION]
> This is a **destructive** command — confirm with the user before executing.

---

## Analytics

All analytics commands accept period flags:

| Flag | Description |
|------|-------------|
| `--period <range>` | `7d`, `30d`, or `90d` (default: `30d`) |
| `--from <date>` | Start date (YYYY-MM-DD) |
| `--to <date>` | End date (YYYY-MM-DD) |

### Overview

```bash
selvo analytics overview
selvo analytics overview --period 7d
```

Returns: unique visitors, article views, searches, helpfulness rate.

### Visits

```bash
selvo analytics visits --period 7d
```

Returns daily visit data.

### Article analytics

```bash
selvo analytics articles --period 30d
```

Returns per-article views and feedback.

### Search analytics

```bash
selvo analytics search --period 30d
selvo analytics search --filter missed    # Only failed searches
```

| Flag | Description |
|------|-------------|
| `--filter <type>` | `all` (default), `missed`, or `hit` |

### Feedback

```bash
selvo analytics feedback --period 30d
```

Returns feedback stats and recent votes.

---

## Messages

### List messages

```bash
selvo messages list
selvo messages list --limit 10
```

### Get message

```bash
selvo messages get <id>
```

### Mark as read

```bash
selvo messages read <id>
```

### Delete message

```bash
selvo messages delete <id>
```

> [!CAUTION]
> This is a **destructive** command — confirm with the user before executing.

---

## Media

### Upload file

```bash
selvo media upload <file>
selvo media upload ./screenshot.png
selvo media upload ./logo.svg --category hc-logo
```

| Flag | Description |
|------|-------------|
| `--category <category>` | `article-image` (default), `hc-logo`, `hc-favicon`, `hc-hero-bg`, `collection-icon` |

Returns the public URL. Supported types: JPEG, PNG, GIF, WebP, SVG, ICO. Max 10 MB for article images.

```json
{ "url": "https://...", "filename": "screenshot.png", "content_type": "image/png", "size": 245760 }
```

### Auto-upload from markdown

When `--file` is used with `articles create` or `articles update`, local image paths (`![alt](./path.png)`) are automatically uploaded and replaced with public URLs. The source file is updated on disk — next run won't re-upload.

```bash
# article.md contains: ![Setup](./images/setup.png)
selvo articles update 5 --file ./article.md
# → uploads ./images/setup.png, replaces path in article.md, sends to API
```

Use `--no-writeback` to skip modifying the source file.

### Agent workflow

Upload first, then reference by URL:

```bash
url=$(selvo media upload ./diagram.png --json | jq -r '.url')
selvo articles create --title "Architecture" --collection col_xxx \
  --content "# Architecture\n\n![Diagram]($url)"
```

---

## Common Workflows

### Push a markdown file as a new article

```bash
selvo articles create --title "Install Guide" --collection col_xxx --file ./install.md --status published
```

### Update an article from a local file

```bash
selvo articles update art_xxx --file ./install.md --publish
```

### Batch create articles from a directory

```bash
for file in ./docs/*.md; do
  title=$(head -1 "$file" | sed 's/^# //')
  selvo articles create --title "$title" --collection col_xxx --file "$file" --status published --quiet
done
```

### Export all articles as JSON

```bash
selvo articles list --json | jq '.articles[].id' -r | while read id; do
  selvo articles get "$id" --json > "article-$id.json"
done
```

### Check help center health

```bash
selvo doctor
```

## Community & Feedback

- Repository: https://github.com/selvoapp/cli
- Issues: https://github.com/selvoapp/cli/issues
- Before creating a new issue, search existing issues first

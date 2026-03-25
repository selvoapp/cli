# selvo

Manage your [Selvo](https://selvo.co) help center from the terminal.

```bash
npx @selvo/cli login
npx @selvo/cli articles list
npx @selvo/cli articles create --title "Getting Started" --collection col_xxx --file ./article.md
```

## Install

```bash
npm install -g @selvo/cli
```

Or run directly with `npx`:

```bash
npx @selvo/cli <command>
```

## Quick Start

```bash
# Authenticate with your API key (from Settings → API Keys)
selvo login

# Check your setup
selvo doctor

# List articles
selvo articles list

# Create an article from a markdown file
selvo articles create --title "Install Widget" --collection col_xxx --file ./docs/install.md --status published

# View an article
selvo articles get 1
```

## Commands

### Auth

```bash
selvo login                    # Authenticate with your API key
selvo logout                   # Remove credentials
selvo whoami                   # Show current profile and help center
selvo doctor                   # Run diagnostic checks
selvo auth list                # List all profiles
selvo auth switch <profile>    # Switch active profile
```

### Articles

```bash
selvo articles list                              # List all articles
selvo articles get <id>                          # Get article by ID or number
selvo articles create --title "..." --collection col_xxx  # Create article
selvo articles update <id> --title "New Title"   # Update article
selvo articles delete <id>                       # Delete article
selvo articles publish <id>                      # Publish article
selvo articles unpublish <id>                    # Unpublish article
selvo articles move <id> --collection col_yyy    # Move to collection
selvo articles search "query"                    # Search articles
selvo articles content update <id> --operation append --content "## New Section"
```

### Collections

```bash
selvo collections list                           # List all collections
selvo collections get <id>                       # Get collection with articles
selvo collections create --name "Getting Started"  # Create collection
selvo collections update <id> --name "New Name"  # Update collection
selvo collections delete <id>                    # Delete collection
```

### Help Center

```bash
selvo help-center get                            # View help center info
selvo help-center update --name "New Name"       # Update settings
```

### Domains

```bash
selvo domains list                               # List custom domains
selvo domains create --hostname help.example.com # Add custom domain
selvo domains verify <id>                        # Verify domain
selvo domains delete <id>                        # Remove domain
```

### Analytics

```bash
selvo analytics overview --period 30d            # Dashboard KPIs
selvo analytics visits --period 7d               # Daily visit data
selvo analytics articles                         # Per-article analytics
selvo analytics search                           # Search analytics
selvo analytics feedback                         # Feedback stats
```

### Media

```bash
selvo media upload ./screenshot.png              # Upload image, get URL
selvo media upload ./logo.svg --category hc-logo # Upload with explicit category
```

Local images in markdown are auto-uploaded when using `--file`:

```bash
# article.md contains: ![Setup](./images/setup.png)
selvo articles update 5 --file article.md
# → Uploads ./images/setup.png, replaces path with URL, writes back to file
```

Use `--no-writeback` to skip writing URLs back to the source file.

### Messages

```bash
selvo messages list                              # List contact messages
selvo messages get <id>                          # View message
selvo messages read <id>                         # Mark as read
selvo messages delete <id>                       # Delete message
```

## Global Flags

| Flag | Description |
|------|-------------|
| `--api-key <key>` | Override API key for this request |
| `-p, --profile <name>` | Select credentials profile |
| `--json` | Force JSON output |
| `-q, --quiet` | Suppress stderr, implies --json |
| `--base-url <url>` | Override API base URL |

## Multi-Profile

The CLI supports multiple profiles for different help centers or environments:

```bash
# Login to production
selvo login
# → Stored as "default" profile

# Login to staging
selvo login --key sk_staging_xxx --base-url http://localhost:3000
# → Choose profile name: "staging"

# Switch between profiles
selvo auth switch staging
selvo auth switch default

# List all profiles
selvo auth list
```

Credentials are stored in `~/.config/selvo/credentials.json`.

## For AI Agents

The CLI outputs structured JSON when piped or when `--json` is passed:

```bash
# JSON output for scripts
selvo articles list --json | jq '.articles[].title'

# Quiet mode for CI (no spinners, no prompts)
selvo articles create --title "Auto Doc" --collection col_xxx --file ./doc.md -q
```

## License

MIT

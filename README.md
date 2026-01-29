# Python Runner

A Raycast extension to run Python code snippets and manage execution history.

## Commands

| Command | Description |
|---------|-------------|
| **Run Python** | Write and execute Python code with inline output |
| **Python History** | Browse, re-run, copy, or delete previous snippets |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Run code |
| `⌘N` | Clear input and output (new snippet) |
| `⌘H` | Insert snippet from history |
| `⌘⇧C` | Copy output |

## History

- Persisted via Raycast `LocalStorage`
- Automatically deduplicated (re-running moves to top)
- Limited to 50 entries
- Accessible from both commands

### Python History actions

| Shortcut | Action |
|----------|--------|
| `Enter` | Re-run snippet |
| `⌘⇧C` | Copy code |
| `⌃X` | Delete entry |
| `⌃⇧X` | Clear all history |

## Preferences

| Name | Default | Description |
|------|---------|-------------|
| Python Path | `python3` | Path to the Python interpreter |

## Development

```bash
npm install
npm run dev
```

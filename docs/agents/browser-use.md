# Browser-Use Setup

Use this when screenshot/testing tasks require the `browser-use` CLI and it is missing on your machine.

## Install

1. Install `uv`:
   - macOS/Linux:
     - `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Windows (PowerShell):
     - `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`
2. Install `browser-use`:
   - `uv pip install browser-use`
3. Install browser binaries:
   - `uvx browser-use install`

## Verify

1. Confirm the CLI is available:
   - `uvx browser-use --help`
2. If the command is still not found in a terminal session:
   - Restart the shell (or open a new terminal tab) so PATH updates are loaded.

## Source

- Official repo: https://github.com/browser-use/browser-use
- Official AGENTS install snippet (used here): https://raw.githubusercontent.com/browser-use/browser-use/main/AGENTS.md

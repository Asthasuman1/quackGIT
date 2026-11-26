# quackGIT VS Code MVP

Basic starting-phase extension for analyzing the currently open file.

## Use

1. Open a source-code file in VS Code.
2. Press `Ctrl+Shift+P`.
3. Run `quackGIT: Analyze Current File`.
4. The extension sends the file to the existing `POST /prediction/` endpoint.
5. The returned result is shown in a VS Code panel.

## Backend URL

Default: `http://localhost:8000`

For deployed testing, set `quackgit.apiUrl` in VS Code Settings, for example `https://quackgit.onrender.com`.

## MVP scope

This first version does not yet add account login, automatic repository scanning, inline diagnostics, or Marketplace publishing.

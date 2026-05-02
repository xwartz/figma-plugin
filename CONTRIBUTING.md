# Contributing to Design Handoff Bridge

Thanks for taking the time to contribute.

## Getting Started

Prerequisites:

- Node.js
- pnpm

```bash
git clone https://github.com/xwartz/figma-plugin.git
cd figma-plugin
pnpm install
```

Run a development build watcher:

```bash
pnpm dev
```

Load the plugin in Figma with **Plugins -> Development -> Import plugin from manifest**, then select `manifest.json`.

## Checks

Run formatting and lint checks:

```bash
pnpm run check
```

Run tests:

```bash
pnpm exec vitest run
```

Build the plugin:

```bash
pnpm run build
```

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/app/` | Figma plugin controller and React UI |
| `src/common/` | Shared token export and transform logic |
| `.github/ISSUE_TEMPLATE/` | Local GitHub issue templates used by handoff flows |
| `scripts/build-plugin.mjs` | Plugin build script |

## Product Scope

Design Handoff Bridge currently focuses on:

- Exporting design tokens JSON from Figma variables and selected styles.
- Creating GitHub handoff issues for design token changes.
- Creating GitHub handoff issues for design primitive changes.
- Syncing token exports to a configured GitHub repository when needed by a token issue.

## Reporting Bugs

Open a GitHub issue with:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Plugin version
- Figma version

## License

By contributing, you agree your changes will be licensed under the project's MIT License.

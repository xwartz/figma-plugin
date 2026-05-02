# Design Handoff Bridge

Design Handoff Bridge is a Figma plugin for design-system teams that need a clean handoff from Figma to GitHub. It exports design tokens, opens prefilled handoff issues, and can sync a token JSON file into a target repository.

Inspired by [TokensBrücke](https://github.com/tokens-bruecke/figma-plugin).

## Core Workflows

- Export Figma variables and selected styles as design token JSON.
- Create GitHub issues for token changes from a local issue template.
- Create GitHub issues for reusable design primitives from a separate template.
- Auto-fill issue context from the current Figma selection.
- Sync `design-tokens.json` to the target repository when a token handoff needs an export file.

## Plugin Menu

- `Export Design Token Json`: review export settings and download the current token JSON.
- `Send Design Token to Issue`: open the token handoff form and create or update a GitHub issue.
- `Send Design Primitive to Issue`: open the primitive handoff form for reusable components.
- `Settings`: configure export options and GitHub repository settings.
- `Clear Cache`: remove saved settings, credentials, and handoff drafts from Figma `clientStorage`.
- `Help`: open the project repository.

## GitHub Handoff Model

- The plugin uses local templates from `.github/ISSUE_TEMPLATE/design-token.yml` and `.github/ISSUE_TEMPLATE/design-primitive.yml`.
- Token and primitive handoff drafts are stored separately, so shared fields do not overwrite each other.
- Token handoff can create or update an issue, push `design-tokens.json` to the configured branch and path, and write the exported file URL back into the issue body.
- Repository settings accept either `owner + repo` or a full GitHub URL such as `https://github.com/owner/repo`.

## Development

Install dependencies:

```bash
pnpm install
```

Run the dev watcher:

```bash
pnpm dev
```

Build the plugin bundle:

```bash
pnpm build
```

Run verification:

```bash
pnpm lint
pnpm test
```

Build output is written to `dist/figma-plugin/`, with a zip artifact at `dist/figma-plugin.zip`.

## Project Structure

| Path | Purpose |
| --- | --- |
| `manifest.json` | Figma plugin manifest and menu commands |
| `src/app/controller/` | Figma main-thread controller |
| `src/app/views/` | React UI views for menu, settings, and handoff forms |
| `src/app/api/servers/` | GitHub issue and export sync logic |
| `src/common/` | Shared token export and transform logic |

## Release

For Figma Community submission steps, listing copy, and asset prep, see [docs/figma-community-release.md](docs/figma-community-release.md).

## License

MIT

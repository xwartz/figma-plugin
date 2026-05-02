# Design Handoff Bridge

Design Handoff Bridge is a Figma plugin for turning design work into actionable GitHub handoff issues.

It helps designers:

- Export Figma variables and selected styles as design tokens JSON.
- Create GitHub issues for design token changes.
- Create GitHub issues for reusable design primitive changes.
- Auto-fill issue context from the current Figma selection.
- Sync `design-tokens.json` to the target GitHub repository when a token handoff needs an export file.

Inspired by [TokensBrücke](https://github.com/tokens-bruecke/figma-plugin).

## Features

### Plugin Menu

The plugin exposes these menu actions in Figma:

- `Export Design Token Json`
- `Send Design Token to Issue`
- `Send Design Primitive to Issue`
- `Settings`
- `Clear Cache`
- `Help`

### Export Design Token Json

Opens the Design tokens settings panel. From there, designers can review export settings and click `Download` to export the current Figma variables and included styles as JSON.

Supported export settings include:

- Color mode, defaulting to `RGBA CSS`
- Included Figma styles: typography, grids, effects, and colors
- Style collection placement
- Split collections into separate files
- Omit collection names
- Include variable scopes, enabled by default
- Use DTCG keys format, enabled by default
- Include Figma metadata, enabled by default
- Include `.value` string for aliases
- Percentage opacity output

### Send Design Token to Issue

Opens a handoff form based on `.github/ISSUE_TEMPLATE/design-token.yml`.

The plugin auto-fills Figma context where possible, including:

- Figma URL
- Selected node name
- Selected node type
- Current page name

When submitted with `Save & send`, the plugin:

- Saves the issue form values separately from primitive handoff values.
- Creates or updates a GitHub issue in the configured target repository.
- Syncs `design-tokens.json` to the configured export branch/path.
- Updates the issue body with the GitHub link to the exported token file.

### Send Design Primitive to Issue

Opens a handoff form based on `.github/ISSUE_TEMPLATE/design-primitive.yml`.

This flow is intended for reusable UI primitives and components. It saves its issue fields separately from the token handoff form, so shared field names such as `summary`, `acceptance_criteria`, and `optional_references` do not overwrite token issue values.

When submitted with `Save & send`, the plugin creates or updates a GitHub issue using the primitive template.

### Settings

Settings are split into two tabs:

- `Design tokens`: export configuration for token JSON.
- `GitHub`: repository settings used by handoff issues.

GitHub settings currently require:

- Personal access token
- Owner
- Repository
- Export branch

Repository can be entered as either a repository name plus owner, or as a full GitHub URL such as `https://github.com/owner/repo`.

`Clear Cache` resets saved plugin settings, GitHub credentials, and handoff form drafts stored in Figma `clientStorage`. The plugin asks for confirmation before clearing the cache.

## GitHub Issue Templates

The plugin uses local issue templates:

- `.github/ISSUE_TEMPLATE/design-token.yml`
- `.github/ISSUE_TEMPLATE/design-primitive.yml`

The plugin no longer downloads issue templates dynamically from the target repository. This keeps the UI predictable and makes the handoff contract explicit in this repository.

## Development

Install dependencies:

```bash
pnpm install
```

Run a development build watcher:

```bash
pnpm dev
```

Build the Figma plugin:

```bash
pnpm run build
```

Run checks:

```bash
pnpm run check
pnpm exec vitest run
```

The built plugin is generated under `dist/figma-plugin/`, with a zip artifact at `dist/figma-plugin.zip`.

## Project Structure

| Path | Purpose |
| --- | --- |
| `manifest.json` | Figma plugin manifest and plugin menu commands |
| `src/app/controller/` | Figma main-thread controller |
| `src/app/views/` | React UI views for menu, settings, and handoff forms |
| `src/app/api/servers/` | GitHub issue/template and sync logic |
| `src/common/` | Shared token export and transform logic |

## License

MIT

# Figma Community Release Guide

This guide keeps the public release checklist, listing copy, security notes, and visual asset references for Design Handoff Bridge.

Source: Figma Help, "Publish plugins to the Figma Community".

## Launch Checklist

- Use Figma Desktop on macOS or Windows for submission.
- Enable two-factor authentication on the publishing Figma account.
- Confirm `manifest.json` has the real Figma plugin id, not the placeholder id.
- Confirm `manifest.json` reports restricted network access for `https://api.github.com` and `https://github.com`.
- Align `package.json` version, `CHANGELOG.md`, release tag, GitHub release notes, and the Figma update notes.
- Confirm `package.json` repository, `src/app/controller/config.ts`, README support text, and the Community support contact point to the same public repository.
- Confirm the default branch used by CI, release automation, and `config.changelogLink` is the same branch.
- Run `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm lint`, and `pnpm build`.
- Test the plugin with a real GitHub repository and a valid personal access token.
- Remove personal tokens, private repository names, private Figma content, and internal screenshots from all demo assets.

## Listing Copy

### Name

Design Handoff Bridge

### Tagline

Turn Figma variables and reusable primitives into GitHub-ready handoff issues.

### Category

Software development

Alternative: Design tools.

### Short Description

Design Handoff Bridge helps design-system teams export tokens, capture Figma context, and send structured handoff issues to GitHub without leaving Figma.

### Full Description

Design Handoff Bridge connects Figma design-system work to GitHub implementation workflows.

Use it to export variables and selected styles as token JSON, create prefilled issues for token or primitive changes, and sync the exported token file to a target repository when engineers need a concrete artifact.

Built for teams that already use GitHub issues, reusable UI primitives, and design tokens to move design-system changes into code.

### Key Features

- Export Figma variables and selected styles as JSON.
- Create token handoff issues from a dedicated template.
- Create primitive handoff issues from a separate template.
- Auto-fill page, node, and selection context from the current Figma selection.
- Sync `design-tokens.json` to a configured GitHub branch and path.

### Search Terms

- design tokens
- github issues
- handoff
- design system
- figma variables
- token export

### Support Contact

Use the public GitHub Issues page for the canonical repository.

## User Setup Notes

- Users need a GitHub repository where the plugin can create issues.
- Users need a GitHub personal access token with permission to create issues.
- Token export sync also needs permission to create or update files on the configured export branch.
- Repository settings can use either `owner + repo` or a full GitHub URL such as `https://github.com/owner/repo`.

## Data Security Notes

Use this section when completing the Figma data security disclosure.

- The plugin stores settings, GitHub repository configuration, handoff drafts, and the user-provided GitHub personal access token in Figma `clientStorage`.
- The plugin sends data to GitHub only when the user exports or sends a handoff through the GitHub flow.
- Data sent to GitHub can include issue field text, Figma page and node context, exported design token JSON, target repository details, branch name, file path, and commit message.
- The plugin uses GitHub API requests through `https://api.github.com` and opens GitHub links through `https://github.com`.
- The plugin does not declare unrestricted network access.
- The plugin does not run its own backend service.
- The `Clear Cache` command removes saved settings, credentials, and handoff drafts from Figma `clientStorage`.
- The `Help` command opens the public repository URL in the browser.

Recommended disclosure summary:

```md
Design Handoff Bridge stores user settings and GitHub credentials locally in Figma clientStorage. It sends handoff issue content and optional exported design token JSON to GitHub only when the user triggers a GitHub handoff action. Network access is restricted to GitHub domains declared in the plugin manifest.
```

## Visual Assets

Figma currently recommends these visuals during plugin submission:

- Icon: `128 x 128 px`
- Thumbnail: `1920 x 1080 px`
- Carousel: up to nine optional images or videos
- Optional playground file: a Figma file where users can try the plugin quickly

Selected direction: variation 2.

- Source page: `source/design_handoff_bridge_community_2.html`
- Source icon: `source/design_handoff_bridge_icon_2.svg`

Upload-ready files:

- Icon: `assets/icon-128x128.png`
- Thumbnail: `assets/thumbnail-1920x1080.png`
- Carousel 1: `assets/carousel-01-export-tokens.png`
- Carousel 2: `assets/carousel-02-create-token-issue.png`
- Carousel 3: `assets/carousel-03-primitive-handoff.png`
- Carousel 4: `assets/carousel-04-github-settings.png`
- Carousel 5: `assets/carousel-05-synced-result.png`
- Playground starter: `assets/playground-file-import.svg`

Repository layout:

- `assets/` contains the committed, upload-ready files that can also be reused in README or release docs.
- `source/` contains the editable source HTML and SVG used to generate those assets.
- `render/` is regenerated by `pnpm release:community`, is treated as an intermediate artifact, and is gitignored.

Regenerate upload-ready files:

```bash
pnpm release:community
```

The command writes temporary render pages into `render/`, captures PNGs into `assets/`, verifies PNG dimensions, and refreshes the playground starter SVG.

Prepare an optional playground Figma file with:

- One variable collection with light and dark modes.
- A few text, color, grid, and effect styles.
- A reusable component or primitive for the primitive issue flow.
- A page named `Try Design Handoff Bridge`.

## Publish Flow

1. Open the plugin in Figma Desktop.
2. Go to `Plugins > Manage plugins`.
3. Open the plugin actions menu and choose `Publish`.
4. In `Describe your resource`, enter the listing copy, category, and search terms.
5. In `Choose some images`, upload the icon, thumbnail, carousel assets, and optional playground file.
6. Complete the data security disclosure with the notes above.
7. In `Add the final details`, publish to `Community`, choose the publisher identity, add the support contact, review the network access label, and configure contributors or comments.
8. Click `Publish` to submit for review.

## Submission QA

- Verify all plugin menu actions work: export JSON, token issue, primitive issue, settings, clear cache, and help.
- Verify a fresh install with empty storage opens correctly.
- Verify `Send Design Token to Issue` creates a new issue when issue number is empty.
- Verify `Send Design Token to Issue` updates an existing issue when issue number is provided.
- Verify token handoff sync creates or updates `design-tokens.json` on the configured branch and path.
- Verify `Send Design Primitive to Issue` keeps draft fields separate from token handoff.
- Verify `Clear Cache` removes stored settings, credentials, and drafts.
- Verify broken GitHub credentials show a visible error toast.
- Verify Help, README, changelog, and support links point to public URLs.
- Verify the final Figma publish screen shows restricted network access.

## Release Notes

```md
Initial public release of Design Handoff Bridge.

- Export Figma variables and selected styles as design token JSON
- Create GitHub handoff issues for token changes
- Create GitHub handoff issues for reusable design primitives
- Auto-fill issue context from the current Figma selection
- Sync exported token JSON to a configured GitHub repository path
```

## Review Notes

- New Community submissions go into review before they become publicly listed.
- Figma states review and approval can take up to two weeks.
- You can still ship plugin updates while the first submission is in review.

## Post-Approval

- Copy the public Community URL into the repository README, changelog, and team docs.
- Share the listing with the design system team and ask for early install feedback.
- Track installation blockers from Community comments and GitHub issues.

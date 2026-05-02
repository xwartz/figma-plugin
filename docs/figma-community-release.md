# Figma Community Release Guide

This guide prepares Design Handoff Bridge for a public Figma Community release. It includes the publish flow, the listing copy, and the asset checklist.

Source: Figma Help, "Publish plugins to the Figma Community".

## Pre-Publish Checklist

- Use the Figma desktop app on macOS or Windows for submission.
- Enable two-factor authentication on the Figma account used for publishing.
- Run `pnpm lint`, `pnpm test`, and `pnpm build` before every submission.
- Confirm the plugin works against a real GitHub repository with a valid personal access token.
- Confirm `manifest.json` keeps network access restricted to `https://api.github.com` and `https://github.com`.
- Remove any personal tokens, test repository names, and private screenshots from demo assets.
- Make sure the support contact points to a monitored inbox or GitHub issue tracker.

## Publish Flow

1. Open the plugin in the Figma desktop app.
2. Go to `Plugins > Manage plugins`.
3. Open the plugin actions menu and choose `Publish`.
4. In `Describe your resource`, enter the name, tagline, description, and category.
5. In `Choose some images`, upload the icon, thumbnail, and any optional carousel assets or demo video.
6. Optionally complete the data security disclosure if you want the listing to show security answers.
7. In `Add the final details`, publish to `Community`, choose the publisher identity, add the support contact, review the network access label, and configure contributors or comments.
8. Click `Publish` to submit for review.

## Review Notes

- New Community submissions go into review before they become publicly listed.
- Figma states review and approval can take up to two weeks.
- You can still ship plugin updates while the first submission is in review.
- Restricted network access is preferable here because the plugin only talks to GitHub domains declared in the manifest.

## Recommended Listing Copy

### Name

Design Handoff Bridge

### Tagline

Turn Figma variables and reusable primitives into GitHub-ready handoff issues.

### Short Description

Design Handoff Bridge helps design-system teams export design tokens, capture Figma context, and send structured handoff issues to GitHub without leaving Figma.

### Full Description

Design Handoff Bridge connects design work in Figma to engineering workflows in GitHub.

Use it to export variables and selected styles as token JSON, open prefilled handoff issues for token or primitive changes, and sync the exported token file into a target repository when a handoff needs a concrete artifact.

The plugin is built for teams that already use GitHub issues and design tokens as part of their design-system delivery process.

### Key Features

- Export Figma variables and selected styles as JSON.
- Create token handoff issues from a dedicated local issue template.
- Create primitive handoff issues from a separate template with isolated draft state.
- Auto-fill page, node, and selection context from the current Figma selection.
- Sync `design-tokens.json` to a configured GitHub branch and path.

### Suggested Category

Software development

Alternative if you want a broader positioning: Design tools.

### Suggested Search Terms

- design tokens
- github issues
- handoff
- design system
- figma variables
- token export

### Support Contact

Use one of these:

- GitHub issues URL for this repository
- Maintainer email address
- Team support alias for the design system

## Required Assets

Figma currently recommends these visuals during plugin submission:

- Icon: `128 x 128 px`
- Thumbnail: `1920 x 1080 px`
- Carousel: up to nine optional images or videos
- Optional playground file: a Figma file where users can try the plugin quickly

## Asset Plan For This Plugin

### Icon

- Visual idea: a bridge motif connecting a Figma token dot cluster to a GitHub issue card.
- Keep it simple enough to read at small sizes.
- Prefer a neutral background and strong silhouette over tiny details.

### Thumbnail

- Frame 1: Figma variables and styles on the left.
- Frame 2: handoff form in the center with auto-filled context.
- Frame 3: GitHub issue and `design-tokens.json` sync result on the right.
- Headline suggestion: `From Figma variables to GitHub handoff issues`.

### Carousel Suggestions

- Slide 1: Export settings panel.
- Slide 2: Token handoff issue form.
- Slide 3: Primitive handoff issue form.
- Slide 4: GitHub settings tab.
- Slide 5: Example GitHub issue plus synced token file path.

### Playground File

Prepare a Figma demo file that contains:

- One variable collection with light and dark modes.
- A few text, color, grid, and effect styles.
- A reusable component or primitive to demonstrate the primitive issue flow.
- A page named `Try Design Handoff Bridge` so the first-run experience is obvious.

## Submission QA

- Verify all six plugin menu actions work.
- Verify `Send Design Token to Issue` creates a new issue when issue number is empty.
- Verify it updates an existing issue when issue number is provided.
- Verify `Send Design Primitive to Issue` keeps its draft fields separate from token handoff.
- Verify `Clear Cache` removes stored settings and drafts.
- Verify broken GitHub credentials show an error toast instead of failing silently.
- Verify the README and support links in the plugin point to public URLs.

## Release Notes Template

```md
Initial public release of Design Handoff Bridge.

- Export Figma variables and selected styles as design token JSON
- Create GitHub handoff issues for token changes
- Create GitHub handoff issues for reusable design primitives
- Auto-fill issue context from the current Figma selection
- Sync exported token JSON to a configured GitHub repository path
```

## Post-Approval

- Copy the public Community URL into the repository README, changelog, and team docs.
- Share the listing with the design system team and ask for early install feedback.
- Track installation blockers from Community comments and GitHub issues.

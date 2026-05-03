# Changelog

## 1.0.2 - 2026-05-03

### Other Changes

- chore: Refactor scripts and update CI workflows to streamline verification and release processes, including new verification script and improved GitHub Actions configuration (310b4c1)
- chore: Update documentation links in config.ts to use consistent quotation marks and correct changelog URL (e0d30ae)
- ci: deps: Bump pnpm/action-setup from 4 to 6 (#7) (a5fd9c1)
- chore: Add GitHub workflows for auto-merging pull requests and generating labels, along with Dependabot configuration and label definitions for better project management. (2f06fec)

## 1.0.0

### Features

- Export design tokens JSON from Figma variables and selected styles.
- Create GitHub issues for design token handoff.
- Create GitHub issues for design primitive handoff.
- Auto-fill issue context from the current Figma selection.
- Sync token export files to the configured GitHub repository for token handoff issues.

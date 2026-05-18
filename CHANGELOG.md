# Changelog

## 1.0.3 - 2026-05-18

### Other Changes

- chore: add usage section to README (6d06625)
- chore(deps)(deps-dev): Bump @types/node from 25.7.0 to 25.8.0 (#22) (a0b4a93)
- chore(deps)(deps-dev): Bump vite from 8.0.12 to 8.0.13 (#21) (7255420)
- chore(deps)(deps-dev): Bump @figma/plugin-typings (#20) (c459379)
- chore(deps)(deps-dev): Bump yaml from 2.8.4 to 2.9.0 (#19) (10c0e42)
- chore(deps)(deps-dev): Bump vitest from 4.1.5 to 4.1.6 (#16) (521ea8b)
- chore(deps)(deps-dev): Bump vite from 8.0.11 to 8.0.12 (#18) (ad93816)
- chore(deps)(deps-dev): Bump @biomejs/biome from 2.4.14 to 2.4.15 (#17) (bcf40c2)
- chore(deps)(deps-dev): Bump @types/node from 25.6.2 to 25.7.0 (#15) (e6696f4)
- chore(deps)(deps-dev): Bump @types/node from 25.6.1 to 25.6.2 (#14) (8998a35)
- chore(deps)(deps-dev): Bump vite from 8.0.10 to 8.0.11 (#13) (3524f52)
- chore(deps)(deps-dev): Bump react-dom from 19.2.5 to 19.2.6 (#12) (88d169f)
- chore(deps)(deps-dev): Bump @types/node from 25.6.0 to 25.6.1 (#11) (a80b295)
- chore(deps)(deps-dev): Bump react from 19.2.5 to 19.2.6 (#10) (c4edd9b)
- chore(deps)(deps-dev): Bump @babel/preset-env from 7.29.3 to 7.29.5 (#9) (1e11d59)

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

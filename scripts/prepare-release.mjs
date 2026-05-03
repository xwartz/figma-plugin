import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const changelogPath = path.join(rootDir, 'CHANGELOG.md')
const packageJsonPath = path.join(rootDir, 'package.json')
const releaseNotesPath =
  process.env.RELEASE_NOTES_PATH ?? path.join(rootDir, 'RELEASE_NOTES.md')
const gitHubOutputPath = process.env.GITHUB_OUTPUT

function runGit(args, options = {}) {
  return execFileSync('git', args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim()
}

function runOptionalGit(args) {
  try {
    return runGit(args)
  } catch {
    return ''
  }
}

function writeOutput(outputs) {
  if (!gitHubOutputPath) {
    return
  }

  appendFileSync(
    gitHubOutputPath,
    `${Object.entries(outputs)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}\n`,
  )
}

function getReleaseCommits() {
  const latestTag = runOptionalGit([
    'describe',
    '--tags',
    '--match',
    'v[0-9]*',
    '--abbrev=0',
  ])
  const range = latestTag ? `${latestTag}..HEAD` : 'HEAD'
  const rawLog = runGit(['log', '--format=%H%x1f%s%x1f%b%x1e', range])

  if (!rawLog) {
    return []
  }

  return rawLog
    .split('\x1e')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [hash, subject, body = ''] = entry.split('\x1f')
      return { hash, subject, body }
    })
    .filter(
      (commit) => !/^chore\(release\): v\d+\.\d+\.\d+/.test(commit.subject),
    )
}

function getBumpType(commits) {
  const hasBreakingChange = commits.some(
    (commit) =>
      /^[a-z]+(?:\([^)]+\))?!:/i.test(commit.subject) ||
      /(^|\n)BREAKING CHANGE:/i.test(commit.body),
  )

  if (hasBreakingChange) {
    return 'major'
  }

  const hasFeature = commits.some((commit) =>
    /^feat(?:\([^)]+\))?:/i.test(commit.subject),
  )

  if (hasFeature) {
    return 'minor'
  }

  return 'patch'
}

function bumpVersion(currentVersion, bumpType) {
  const [major, minor, patch] = currentVersion.split('.').map(Number)

  if ([major, minor, patch].some(Number.isNaN)) {
    throw new Error(`Invalid package version: ${currentVersion}`)
  }

  if (bumpType === 'major') {
    return `${major + 1}.0.0`
  }

  if (bumpType === 'minor') {
    return `${major}.${minor + 1}.0`
  }

  return `${major}.${minor}.${patch + 1}`
}

function getCommitDetails(commit) {
  const match = commit.subject.match(/^([a-z]+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/i)

  if (!match) {
    return {
      category: 'Other Changes',
      text: commit.subject,
      isBreaking: /(^|\n)BREAKING CHANGE:/i.test(commit.body),
    }
  }

  const [, type, scope, bang, description] = match
  const normalizedType = type.toLowerCase()
  const scopedDescription = scope ? `${scope}: ${description}` : description

  if (bang || /(^|\n)BREAKING CHANGE:/i.test(commit.body)) {
    return {
      category: 'Breaking Changes',
      text: scopedDescription,
      isBreaking: true,
    }
  }

  if (normalizedType === 'feat') {
    return { category: 'Features', text: scopedDescription, isBreaking: false }
  }

  if (normalizedType === 'fix' || normalizedType === 'perf') {
    return { category: 'Fixes', text: scopedDescription, isBreaking: false }
  }

  return {
    category: 'Other Changes',
    text: `${normalizedType}: ${scopedDescription}`,
    isBreaking: false,
  }
}

function createReleaseMarkdown({ version, commits }) {
  const groupedCommits = new Map()

  for (const commit of commits) {
    const details = getCommitDetails(commit)
    const shortHash = commit.hash.slice(0, 7)
    const item = `- ${details.text} (${shortHash})`
    const items = groupedCommits.get(details.category) ?? []
    items.push(item)
    groupedCommits.set(details.category, items)
  }

  const categories = ['Breaking Changes', 'Features', 'Fixes', 'Other Changes']
  const sections = categories
    .filter((category) => groupedCommits.has(category))
    .map((category) => {
      const items = groupedCommits.get(category)
      return `### ${category}\n\n${items.join('\n')}`
    })

  const releaseDate = new Date().toISOString().slice(0, 10)
  return `## ${version} - ${releaseDate}\n\n${sections.join('\n\n')}\n`
}

function updatePackageVersion(version) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  packageJson.version = version
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
}

function updateChangelog(releaseMarkdown) {
  const currentChangelog = readFileSync(changelogPath, 'utf8').trimStart()
  const heading = '# Changelog'
  const changelogBody = currentChangelog.startsWith(heading)
    ? currentChangelog.slice(heading.length).trimStart()
    : currentChangelog

  writeFileSync(
    changelogPath,
    `${`${heading}\n\n${releaseMarkdown}\n${changelogBody}`.trimEnd()}\n`,
  )
}

function main() {
  const commits = getReleaseCommits()

  if (commits.length === 0) {
    writeOutput({ should_release: 'false' })
    return
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  const bumpType = getBumpType(commits)
  const version = bumpVersion(packageJson.version, bumpType)
  const tag = `v${version}`
  const existingTag = runOptionalGit(['tag', '--list', tag])

  if (existingTag) {
    throw new Error(`Tag ${tag} already exists.`)
  }

  const releaseMarkdown = createReleaseMarkdown({ version, commits })

  updatePackageVersion(version)
  updateChangelog(releaseMarkdown)
  writeFileSync(releaseNotesPath, `# ${tag}\n\n${releaseMarkdown}`, 'utf8')
  writeOutput({ should_release: 'true', version, tag, bump_type: bumpType })
}

main()

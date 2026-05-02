import { Octokit } from '@octokit/core'
import { Buffer } from 'buffer'
import {
  type GithubIssueTemplate,
  getRequiredIssueFieldIds,
  parseGithubRepoTarget,
  renderGithubIssueBody,
  renderGithubIssueTitle,
} from './githubIssueTemplates'
import {
  getLocalGithubIssueTemplate,
  getLocalGithubIssueTemplateFileName,
} from './localGithubIssueTemplates'

const DEFAULT_TOKEN_EXPORT_PATH = 'issues/<issue-number>/design-tokens.json'
const HANDOFF_LABEL = 'design:handoff'
const DEFAULT_TOKEN_COMMIT_MESSAGE = 'chore(design): update design tokens'
const DEFAULT_PRIMITIVE_COMMIT_MESSAGE =
  'chore(design): update primitive handoff'
const ISSUE_NUMBER_TEMPLATE_LITERAL = '$' + '{issueNumber}'

function hasText(value?: string) {
  return Boolean(value?.trim())
}

function getIssueState(credentials: GithubCredentialsI) {
  const handoffType = credentials.handoffType || 'token'

  return (
    credentials.issueStateByKind[handoffType] ?? {
      issueNumber: '',
      fields: {},
    }
  )
}

function resolveTokenExportPath(credentials: GithubCredentialsI) {
  const issueNumber = getIssueState(credentials).issueNumber?.trim()
  const fileName = credentials.fileName?.trim() || DEFAULT_TOKEN_EXPORT_PATH

  if (!issueNumber) {
    return fileName
  }

  return fileName
    .replaceAll('<issue-number>', issueNumber)
    .replaceAll('{issue-number}', issueNumber)
    .replaceAll(ISSUE_NUMBER_TEMPLATE_LITERAL, issueNumber)
}

function validateTemplateHandoff({
  credentials,
  template,
}: {
  credentials: GithubCredentialsI
  template: GithubIssueTemplate
}) {
  const values = getIssueFieldValues({ credentials })
  const missingFields = getRequiredIssueFieldIds(template).filter((fieldId) => {
    if (fieldId === 'token_export') {
      return false
    }

    return !hasText(values[fieldId])
  })

  if (missingFields.length > 0) {
    return `Fill required issue fields before syncing: ${missingFields.join(
      ', ',
    )}.`
  }

  return null
}

function getGithubBlobUrl({
  branch,
  fileName,
  owner,
  repo,
}: {
  branch: string
  fileName: string
  owner: string
  repo: string
}) {
  return `https://github.com/${owner}/${repo}/blob/${encodeURIComponent(
    branch,
  )}/${fileName
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`
}

function getIssueFieldValues({
  credentials,
  tokenExportUrl = '',
}: {
  credentials: GithubCredentialsI
  tokenExportUrl?: string
}) {
  const issueFields = getIssueState(credentials).fields

  return {
    ...issueFields,
    figma_url: issueFields.figma_url || '',
    token_group: issueFields.token_group || '',
    primitive_name: issueFields.primitive_name || '',
    summary: issueFields.summary || '',
    semantic_intent: issueFields.semantic_intent || '',
    modes: issueFields.modes || '',
    affected_primitives: issueFields.affected_primitives || '',
    token_export: tokenExportUrl || issueFields.token_export || '',
    anatomy: issueFields.anatomy || '',
    variants: issueFields.variants || '',
    states: issueFields.states || '',
    usage_notes: issueFields.usage_notes || '',
    acceptance_criteria: issueFields.acceptance_criteria || '',
    optional_references: issueFields.optional_references || '',
  }
}

function buildIssueBody({
  credentials,
  template,
  tokenExportUrl,
}: {
  credentials: GithubCredentialsI
  template: GithubIssueTemplate
  tokenExportUrl: string
}) {
  return renderGithubIssueBody({
    template,
    values: getIssueFieldValues({ credentials, tokenExportUrl }),
  })
}

function getCommitMessage({
  credentials,
  issueNumber,
}: {
  credentials: GithubCredentialsI
  issueNumber: string
}) {
  if (hasText(credentials.commitMessage)) {
    return credentials.commitMessage
  }

  const defaultMessage =
    (credentials.handoffType || 'token') === 'primitive'
      ? DEFAULT_PRIMITIVE_COMMIT_MESSAGE
      : DEFAULT_TOKEN_COMMIT_MESSAGE

  return `${defaultMessage} for issue #${issueNumber}`
}

export const pushToGithub = async (
  credentials: GithubCredentialsI,
  tokens: SerializableObject,
  toastCallback: (props: ToastIPropsI) => void,
): Promise<boolean> => {
  const ghToken = credentials.token
  const { owner: ghUser, repo: ghRepo } = parseGithubRepoTarget(credentials)
  const branch = credentials.branch || 'design-system-exports'
  const fileContent = Buffer.from(JSON.stringify(tokens, null, 2)).toString(
    'base64',
  )

  const octokit = new Octokit({ auth: ghToken })
  const templateFile =
    credentials.templateFile ||
    getLocalGithubIssueTemplateFileName(credentials.preferredTemplateKind)
  const issueTemplate = getLocalGithubIssueTemplate(templateFile)
  const currentIssueState = getIssueState(credentials)

  if (!issueTemplate) {
    toastCallback({
      title: 'Github: Missing issue template',
      message: `Could not find local issue template: ${templateFile}.`,
      options: {
        type: 'error',
        timeout: 8000,
      },
    })
    return false
  }

  const validationError = validateTemplateHandoff({
    credentials,
    template: issueTemplate,
  })
  const shouldSyncTokenExport = issueTemplate.fields.some(
    (field) => field.id === 'token_export',
  )
  const issueLabels =
    issueTemplate.labels.length > 0 ? issueTemplate.labels : [HANDOFF_LABEL]

  if (validationError) {
    toastCallback({
      title: 'Github: Missing handoff fields',
      message: validationError,
      options: {
        type: 'error',
        timeout: 8000,
      },
    })
    return false
  }

  async function ensureBranchExists() {
    try {
      await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
        owner: ghUser,
        repo: ghRepo,
        ref: `heads/${branch}`,
      })
    } catch (error) {
      if (error.status !== 404) {
        throw error
      }

      const repository = await octokit.request('GET /repos/{owner}/{repo}', {
        owner: ghUser,
        repo: ghRepo,
      })
      const defaultBranch = repository.data.default_branch
      const defaultRef = await octokit.request(
        'GET /repos/{owner}/{repo}/git/ref/{ref}',
        {
          owner: ghUser,
          repo: ghRepo,
          ref: `heads/${defaultBranch}`,
        },
      )

      await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
        owner: ghUser,
        repo: ghRepo,
        ref: `refs/heads/${branch}`,
        sha: defaultRef.data.object.sha,
      })
    }
  }

  async function createDraftIssue() {
    const response = await octokit.request(
      'POST /repos/{owner}/{repo}/issues',
      {
        owner: ghUser,
        repo: ghRepo,
        title: renderGithubIssueTitle({
          template: issueTemplate,
          values: getIssueFieldValues({
            credentials,
            tokenExportUrl: shouldSyncTokenExport
              ? 'Pending token export sync.'
              : '',
          }),
        }),
        body: buildIssueBody({
          credentials,
          template: issueTemplate,
          tokenExportUrl: 'Pending token export sync.',
        }),
        labels: issueLabels,
      },
    )

    return response.data.number
  }

  async function updateIssueBody({
    issueNumber,
    tokenExportUrl,
  }: {
    issueNumber: number
    tokenExportUrl: string
  }) {
    await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
      owner: ghUser,
      repo: ghRepo,
      issue_number: issueNumber,
      body: buildIssueBody({
        credentials,
        template: issueTemplate,
        tokenExportUrl,
      }),
    })
  }

  async function addIssueLabels(issueNumber: number) {
    await octokit.request(
      'POST /repos/{owner}/{repo}/issues/{issue_number}/labels',
      {
        owner: ghUser,
        repo: ghRepo,
        issue_number: issueNumber,
        labels: issueLabels,
      },
    )
  }

  async function upsertTokenExport({
    fileName,
    issueNumber,
  }: {
    fileName: string
    issueNumber: string
  }) {
    const commonParams = {
      owner: ghUser,
      repo: ghRepo,
      path: fileName,
    }
    const commonPushParams = {
      ...commonParams,
      message: getCommitMessage({ credentials, issueNumber }),
      content: fileContent,
      branch: branch,
    }

    try {
      const { data: file } = await octokit.request(
        'GET /repos/{owner}/{repo}/contents/{path}',
        {
          ...commonParams,
          ref: branch,
        },
      )

      return octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        ...commonPushParams,
        sha: file.sha,
      })
    } catch (error) {
      if (error.status !== 404) {
        throw error
      }

      return octokit.request(
        'PUT /repos/{owner}/{repo}/contents/{path}',
        commonPushParams,
      )
    }
  }

  try {
    if (shouldSyncTokenExport) {
      await ensureBranchExists()
    }

    const createdIssueNumber = hasText(currentIssueState.issueNumber)
      ? null
      : await createDraftIssue()
    const issueNumber = String(
      createdIssueNumber ?? currentIssueState.issueNumber,
    )
    const syncedCredentials = {
      ...credentials,
      issueStateByKind: {
        ...credentials.issueStateByKind,
        [credentials.handoffType || 'token']: {
          ...currentIssueState,
          issueNumber,
        },
      },
    }
    const fileName = resolveTokenExportPath(syncedCredentials)
    const tokenExportUrl = shouldSyncTokenExport
      ? getGithubBlobUrl({
          branch,
          fileName,
          owner: ghUser,
          repo: ghRepo,
        })
      : ''

    if (shouldSyncTokenExport) {
      await upsertTokenExport({ fileName, issueNumber })
    }

    await updateIssueBody({
      issueNumber: Number(issueNumber),
      tokenExportUrl,
    })
    await addIssueLabels(Number(issueNumber))

    toastCallback({
      title: createdIssueNumber
        ? 'Github: Issue created successfully'
        : 'Github: Updated successfully',
      message: createdIssueNumber
        ? shouldSyncTokenExport
          ? `Created issue #${createdIssueNumber} and synced tokens to ${fileName}.`
          : `Created issue #${createdIssueNumber}.`
        : shouldSyncTokenExport
          ? `Tokens have been synced to ${fileName}.`
          : `Issue #${issueNumber} has been updated.`,
      options: {
        type: 'success',
        timeout: 8000,
      },
    })
    return true
  } catch (error) {
    console.error('Error syncing Github handoff:', error)
    toastCallback({
      title: 'Github: An error occurred',
      message: error.message,
      options: {
        type: 'error',
        timeout: 8000,
      },
    })
    return false
  }
}

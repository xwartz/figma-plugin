import { parse } from 'yaml'

export type GithubRepoTarget = {
  owner: string
  repo: string
}

export type GithubIssueTemplateField = {
  id: string
  label: string
  type: 'input' | 'textarea' | 'select'
  required: boolean
  description?: string
  placeholder?: string
  value?: string
  options?: string[]
}

export type GithubIssueTemplate = {
  fileName: string
  name: string
  title: string
  labels: string[]
  fields: GithubIssueTemplateField[]
}

type RawIssueTemplate = {
  name?: string
  title?: string
  labels?: string[] | string
  body?: RawIssueTemplateItem[]
}

type RawIssueTemplateItem = {
  type?: string
  id?: string
  attributes?: {
    label?: string
    description?: string
    placeholder?: string
    value?: string
    options?: Array<string | { label?: string }>
  }
  validations?: {
    required?: boolean
  }
}

export function parseGithubRepoTarget(
  credentials: Pick<GithubCredentialsI, 'owner' | 'repo'>,
): GithubRepoTarget {
  const repoValue = credentials.repo.trim()
  const repoUrlMatch = repoValue.match(
    /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/,
  )

  if (repoUrlMatch) {
    return {
      owner: repoUrlMatch[1],
      repo: repoUrlMatch[2],
    }
  }

  return {
    owner: credentials.owner.trim(),
    repo: repoValue,
  }
}

function normalizeLabels(labels: RawIssueTemplate['labels']) {
  if (Array.isArray(labels)) {
    return labels.map(String).filter(Boolean)
  }

  if (typeof labels === 'string') {
    return labels
      .split(',')
      .map((label) => label.trim())
      .filter(Boolean)
  }

  return []
}

function normalizeFieldType(type?: string): GithubIssueTemplateField['type'] {
  if (type === 'dropdown') {
    return 'select'
  }

  if (type === 'textarea' || type === 'checkboxes') {
    return 'textarea'
  }

  return 'input'
}

function normalizeOptions(
  options?: RawIssueTemplateItem['attributes']['options'],
) {
  if (!options) {
    return undefined
  }

  return options
    .map((option) => (typeof option === 'string' ? option : option.label))
    .filter((option): option is string => Boolean(option))
}

export function parseGithubIssueTemplate({
  fileName,
  source,
}: {
  fileName: string
  source: string
}): GithubIssueTemplate {
  const rawTemplate = parse(source) as RawIssueTemplate
  const fields = (rawTemplate.body ?? [])
    .filter((item) => item.type !== 'markdown')
    .filter((item) => Boolean(item.id))
    .map((item) => ({
      id: String(item.id),
      label: item.attributes?.label || String(item.id),
      type: normalizeFieldType(item.type),
      required: Boolean(item.validations?.required),
      description: item.attributes?.description,
      placeholder: item.attributes?.placeholder,
      value: item.attributes?.value,
      options: normalizeOptions(item.attributes?.options),
    }))

  return {
    fileName,
    name: rawTemplate.name || fileName,
    title: rawTemplate.title || '',
    labels: normalizeLabels(rawTemplate.labels),
    fields,
  }
}

export function getRequiredIssueFieldIds(template?: GithubIssueTemplate) {
  return (
    template?.fields
      .filter((field) => field.required)
      .map((field) => field.id) ?? []
  )
}

export function renderGithubIssueTitle({
  template,
  values,
}: {
  template?: GithubIssueTemplate
  values: Record<string, string>
}) {
  const fallbackTitle = '[Design Handoff]'
  const title = template?.title || fallbackTitle
  const replacedTitle = title.replace(
    /\{\{?([a-zA-Z0-9_-]+)\}?\}/g,
    (_, fieldId: string) => values[fieldId] || '',
  )

  if (replacedTitle !== title) {
    return replacedTitle.trim()
  }

  const primaryValue =
    values.primitive_name || values.token_group || values.summary || ''

  return `${title}${primaryValue}`.trim()
}

export function renderGithubIssueBody({
  template,
  values,
}: {
  template: GithubIssueTemplate
  values: Record<string, string>
}) {
  return template.fields
    .map((field) => {
      const value = values[field.id] || field.value || ''

      if (!value.trim() && !field.required) {
        return null
      }

      return `### ${field.label}\n\n${value}`
    })
    .filter(Boolean)
    .join('\n\n')
}

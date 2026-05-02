import designPrimitiveTemplateSource from '../../../../.github/ISSUE_TEMPLATE/design-primitive.yml?raw'
import designTokenTemplateSource from '../../../../.github/ISSUE_TEMPLATE/design-token.yml?raw'
import {
  type GithubIssueTemplate,
  parseGithubIssueTemplate,
} from './githubIssueTemplates'

export const LOCAL_GITHUB_ISSUE_TEMPLATES = [
  parseGithubIssueTemplate({
    fileName: 'design-token.yml',
    source: designTokenTemplateSource,
  }),
  parseGithubIssueTemplate({
    fileName: 'design-primitive.yml',
    source: designPrimitiveTemplateSource,
  }),
] as GithubIssueTemplate[]

export function getLocalGithubIssueTemplate(fileName?: string) {
  return LOCAL_GITHUB_ISSUE_TEMPLATES.find(
    (template) => template.fileName === fileName,
  )
}

export function getLocalGithubIssueTemplateFileName(
  preferredTemplateKind?: 'token' | 'primitive',
) {
  return (
    LOCAL_GITHUB_ISSUE_TEMPLATES.find((template) =>
      template.fileName.includes(`design-${preferredTemplateKind ?? 'token'}`),
    )?.fileName ?? LOCAL_GITHUB_ISSUE_TEMPLATES[0].fileName
  )
}

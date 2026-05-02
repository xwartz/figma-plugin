import { describe, expect, it } from 'vitest'

import {
  parseGithubIssueTemplate,
  parseGithubRepoTarget,
  renderGithubIssueBody,
  renderGithubIssueTitle,
} from './githubIssueTemplates'

const tokenTemplateSource = `name: Design Token Handoff
title: '[Design Token]: '
labels: ['design:handoff']
body:
  - type: markdown
    attributes:
      value: Intro copy
  - type: input
    id: figma_url
    attributes:
      label: Figma URL
    validations:
      required: true
  - type: input
    id: token_group
    attributes:
      label: Token group
    validations:
      required: true
  - type: textarea
    id: acceptance_criteria
    attributes:
      label: Acceptance Criteria
      value: |
        - [ ] Tokens are updated.
    validations:
      required: true
  - type: input
    id: token_export
    attributes:
      label: Token export
    validations:
      required: true
`

describe('githubIssueTemplates', () => {
  it('parses GitHub issue form YAML into dynamic fields', () => {
    const template = parseGithubIssueTemplate({
      fileName: 'design-token.yml',
      source: tokenTemplateSource,
    })

    expect(template).toMatchObject({
      fileName: 'design-token.yml',
      name: 'Design Token Handoff',
      title: '[Design Token]: ',
      labels: ['design:handoff'],
    })
    expect(template.fields.map((field) => field.id)).toEqual([
      'figma_url',
      'token_group',
      'acceptance_criteria',
      'token_export',
    ])
    expect(template.fields[2]).toMatchObject({
      type: 'textarea',
      required: true,
    })
  })

  it('renders issue title and body from template values', () => {
    const template = parseGithubIssueTemplate({
      fileName: 'design-token.yml',
      source: tokenTemplateSource,
    })
    const values = {
      figma_url: 'https://www.figma.com/design/file?node-id=1-2',
      token_group: 'color/action',
      token_export:
        '[design-tokens.json](https://github.com/o/r/blob/b/file.json)',
    }

    expect(renderGithubIssueTitle({ template, values })).toBe(
      '[Design Token]: color/action',
    )
    expect(renderGithubIssueBody({ template, values })).toContain(
      '### Token export',
    )
    expect(renderGithubIssueBody({ template, values })).toContain(
      '- [ ] Tokens are updated.',
    )
  })

  it('parses repo shorthand and full GitHub URLs', () => {
    expect(
      parseGithubRepoTarget({
        owner: 'test',
        repo: 'test',
      }),
    ).toEqual({
      owner: 'test',
      repo: 'test',
    })
    expect(
      parseGithubRepoTarget({
        owner: '',
        repo: 'https://github.com/test/test.git',
      }),
    ).toEqual({
      owner: 'test',
      repo: 'test',
    })
  })
})

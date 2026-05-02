import type {
  GithubIssueTemplate,
  GithubIssueTemplateField,
} from '@app/api/servers/githubIssueTemplates'
import {
  getLocalGithubIssueTemplateFileName,
  LOCAL_GITHUB_ISSUE_TEMPLATES,
} from '@app/api/servers/localGithubIssueTemplates'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Input,
  NativeDropdown,
  Panel,
  PanelHeader,
  Stack,
  Text,
} from 'react-figma-ui/ui'
import styles from './styles.module.css'

type GithubLocalConfig = GithubCredentialsI & {
  issueState: GithubIssueStateI
}

type ViewMode = 'settings' | 'handoff'

interface ViewProps {
  JSONsettingsConfig: JSONSettingsConfigI
  setJSONsettingsConfig: React.Dispatch<
    React.SetStateAction<JSONSettingsConfigI>
  >
  setCurrentView: React.Dispatch<React.SetStateAction<string>>
  server: ServerType
  mode?: ViewMode
  handoffKind?: 'token' | 'primitive'
  isSending?: boolean
  onSaveSuccess?: () => void
  onSaveAndSend?: (config: GithubCredentialsI) => void
}

const DEFAULT_GITHUB_CONFIG: GithubLocalConfig = {
  isEnabled: false,
  token: '',
  owner: '',
  repo: '',
  branch: 'design-system-exports',
  fileName: 'issues/<issue-number>/design-tokens.json',
  commitMessage: 'chore(design): update design handoff',
  templateFile: '',
  preferredTemplateKind: 'token',
  issueStateByKind: {},
  issueState: {
    issueNumber: '',
    fields: {},
  },
}

const githubSettingFields = [
  {
    id: 'token',
    label: 'Personal access token',
    placeholder: 'GitHub personal access token with repo scope',
    inputType: 'password',
    required: true,
  },
  {
    id: 'owner',
    label: 'Owner',
    placeholder: 'Repository owner or organization',
    required: false,
  },
  {
    id: 'repo',
    label: 'Repository',
    placeholder: 'Repo name or https://github.com/owner/repo',
    required: true,
  },
  {
    id: 'branch',
    label: 'Export branch',
    placeholder: 'design-system-exports',
    required: true,
  },
] as const

const tokenIssueFields = [
  {
    id: 'issueNumber',
    label: 'Issue number',
    placeholder: 'Leave empty to create a new issue',
    required: false,
  },
  {
    id: 'fileName',
    label: 'Token export path',
    placeholder: 'issues/<issue-number>/design-tokens.json',
    required: false,
  },
  {
    id: 'commitMessage',
    label: 'Commit message',
    placeholder: 'Optional commit message',
    required: false,
  },
] as const

const primitiveIssueFields = [
  {
    id: 'issueNumber',
    label: 'Issue number',
    placeholder: 'Leave empty to create a new issue',
    required: false,
  },
] as const

function getScopedIssueState({
  credentials,
  preferredTemplateKind,
}: {
  credentials?: GithubCredentialsI
  preferredTemplateKind: GithubIssueKind
}) {
  return (
    credentials?.issueStateByKind?.[preferredTemplateKind] ?? {
      issueNumber: '',
      fields: {},
    }
  )
}

function getInitialConfig(
  credentials: GithubCredentialsI | undefined,
  preferredTemplateKind: 'token' | 'primitive',
): GithubLocalConfig {
  return {
    ...DEFAULT_GITHUB_CONFIG,
    ...(credentials ?? {}),
    issueState: getScopedIssueState({ credentials, preferredTemplateKind }),
    issueStateByKind: credentials?.issueStateByKind ?? {},
  }
}

function getFieldDefaultValue(field: GithubIssueTemplateField) {
  return field.value ?? ''
}

function getAutoFieldValues(context?: FigmaSelectionContextI) {
  if (!context) {
    return {}
  }

  return {
    primitive_name: context.nodeName ?? '',
    node_name: context.nodeName ?? '',
    node_type: context.nodeType ?? '',
    page_name: context.pageName ?? '',
  }
}

function mergeTemplateDefaults({
  currentFields,
  template,
  figmaContext,
}: {
  currentFields: Record<string, string>
  template?: GithubIssueTemplate
  figmaContext?: FigmaSelectionContextI
}) {
  const autoValues = getAutoFieldValues(figmaContext)
  const mergedFields = { ...currentFields }

  for (const field of template?.fields ?? []) {
    mergedFields[field.id] =
      autoValues[field.id] ||
      currentFields[field.id] ||
      getFieldDefaultValue(field)
  }

  return mergedFields
}

function getPreferredTemplateFile({
  templates,
  currentTemplateFile,
  preferredTemplateKind,
}: {
  templates: GithubIssueTemplate[]
  currentTemplateFile?: string
  preferredTemplateKind?: 'token' | 'primitive'
}) {
  const preferredTemplate = preferredTemplateKind
    ? templates.find((template) =>
        template.fileName.includes(`design-${preferredTemplateKind}`),
      )
    : undefined

  return (
    preferredTemplate?.fileName ||
    currentTemplateFile ||
    templates[0]?.fileName ||
    ''
  )
}

function withScopedIssueFields(
  config: GithubLocalConfig,
  preferredTemplateKind: 'token' | 'primitive',
  issueFields: Record<string, string>,
): GithubLocalConfig {
  const issueState = {
    ...config.issueState,
    fields: issueFields,
  }

  return {
    ...config,
    issueState,
    issueStateByKind: {
      ...config.issueStateByKind,
      [preferredTemplateKind]: issueState,
    },
  }
}

function withScopedIssueNumber(
  config: GithubLocalConfig,
  preferredTemplateKind: 'token' | 'primitive',
  issueNumber: string,
): GithubLocalConfig {
  const issueState = {
    ...config.issueState,
    issueNumber,
  }

  return {
    ...config,
    issueState,
    issueStateByKind: {
      ...config.issueStateByKind,
      [preferredTemplateKind]: issueState,
    },
  }
}

export const ServerSettingsView = (props: ViewProps) => {
  const {
    JSONsettingsConfig,
    setJSONsettingsConfig,
    setCurrentView,
    mode = 'handoff',
    handoffKind,
    isSending = false,
    onSaveSuccess,
    onSaveAndSend,
  } = props
  const preferredTemplateKind =
    handoffKind ?? JSONsettingsConfig.servers.github.preferredTemplateKind
  const [config, setConfig] = useState<GithubLocalConfig>(
    getInitialConfig(
      {
        ...JSONsettingsConfig.servers.github,
        preferredTemplateKind,
        templateFile: getLocalGithubIssueTemplateFileName(
          preferredTemplateKind,
        ),
      },
      preferredTemplateKind,
    ),
  )
  const [errorFields, setErrorFields] = useState<string[]>([])
  const [figmaContext, setFigmaContext] = useState<FigmaSelectionContextI>()
  const templates = LOCAL_GITHUB_ISSUE_TEMPLATES
  const selectedTemplateFile =
    config.templateFile ||
    getPreferredTemplateFile({
      templates,
      currentTemplateFile: config.templateFile,
      preferredTemplateKind,
    })

  const selectedTemplate = useMemo(() => {
    return templates.find(
      (template) => template.fileName === selectedTemplateFile,
    )
  }, [selectedTemplateFile])

  useEffect(() => {
    const nextTemplateFile =
      config.templateFile ||
      getLocalGithubIssueTemplateFileName(preferredTemplateKind)

    if (config.templateFile === nextTemplateFile) {
      return
    }

    setConfig((prev) => ({
      ...withScopedIssueFields(
        prev,
        preferredTemplateKind,
        mergeTemplateDefaults({
          currentFields: prev.issueState.fields,
          template: selectedTemplate,
          figmaContext,
        }),
      ),
      templateFile: nextTemplateFile,
    }))
  }, [
    config.templateFile,
    preferredTemplateKind,
    figmaContext,
    selectedTemplate,
  ])

  useEffect(() => {
    const nextIssueState = getScopedIssueState({
      credentials: JSONsettingsConfig.servers.github,
      preferredTemplateKind,
    })

    setConfig((prev) =>
      withScopedIssueFields(
        {
          ...prev,
          issueState: nextIssueState,
          preferredTemplateKind,
          templateFile: getLocalGithubIssueTemplateFileName(
            preferredTemplateKind,
          ),
        },
        preferredTemplateKind,
        mergeTemplateDefaults({
          currentFields: nextIssueState.fields,
          template: selectedTemplate,
          figmaContext,
        }),
      ),
    )
  }, [
    preferredTemplateKind,
    JSONsettingsConfig.servers.github,
    selectedTemplate,
    figmaContext,
  ])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data?.pluginMessage as TokensMessageI | undefined

      if (message?.type !== 'setFigmaContext') {
        return
      }

      setFigmaContext(message.figmaContext)
      setConfig((prev) =>
        withScopedIssueFields(
          prev,
          preferredTemplateKind,
          mergeTemplateDefaults({
            currentFields: prev.issueState.fields,
            template: selectedTemplate,
            figmaContext: message.figmaContext,
          }),
        ),
      )
    }

    window.addEventListener('message', handleMessage)
    parent.postMessage(
      {
        pluginMessage: {
          type: 'getFigmaContext',
          tokens: null,
          role: 'preview',
          server: [],
        } as TokensMessageI,
      },
      '*',
    )

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [preferredTemplateKind, selectedTemplate])

  const updateConfigField = (fieldId: string, value: string) => {
    if (fieldId === 'issueNumber') {
      setConfig((prev) =>
        withScopedIssueNumber(prev, preferredTemplateKind, value),
      )
      return
    }

    setConfig((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const updateIssueField = (fieldId: string, value: string) => {
    setConfig((prev) =>
      withScopedIssueFields(prev, preferredTemplateKind, {
        ...prev.issueState.fields,
        [fieldId]: value,
      }),
    )
  }

  const shouldSyncTokenExport = selectedTemplate?.fields.some(
    (field) => field.id === 'token_export',
  )
  const issueMetaFields =
    preferredTemplateKind === 'primitive'
      ? primitiveIssueFields
      : tokenIssueFields
  const visibleRequiredFields =
    mode === 'settings'
      ? githubSettingFields
          .filter((field) => field.required)
          .map((field) => field.id)
      : [
          ...githubSettingFields
            .filter((field) => field.required)
            .map((field) => field.id),
          ...issueMetaFields
            .filter(
              (field) =>
                field.required ||
                (shouldSyncTokenExport &&
                  (field.id === 'fileName' || field.id === 'commitMessage')),
            )
            .map((field) => field.id),
          'templateFile',
          ...(selectedTemplate?.fields
            .filter((field) => field.required && field.id !== 'token_export')
            .map((field) => field.id) ?? []),
        ]

  const isFieldMissing = (fieldId: string) => {
    if (fieldId === 'templateFile') {
      return !config.templateFile
    }

    if (
      [
        ...githubSettingFields,
        ...tokenIssueFields,
        ...primitiveIssueFields,
      ].some((field) => field.id === fieldId)
    ) {
      if (fieldId === 'issueNumber') {
        return !String(config.issueState.issueNumber ?? '').trim()
      }

      return !String(config[fieldId] ?? '').trim()
    }

    return !String(config.issueState.fields[fieldId] ?? '').trim()
  }

  const isFormValid = visibleRequiredFields.every(
    (fieldId) => !isFieldMissing(fieldId),
  )
  const missingGithubSettingLabels = githubSettingFields
    .filter((field) => field.required && isFieldMissing(field.id))
    .map((field) => field.label)

  const renderInputField = (
    field: {
      id: string
      label: string
      placeholder: string
      inputType?: 'text' | 'password'
      required: boolean
    },
    value: string,
    onChange: (value: string) => void,
  ) => {
    const isInvalid = errorFields.includes(field.id)
    const handleBlur = (nextValue: string) => {
      if (!nextValue && field.required) {
        setErrorFields((prev) => [...prev, field.id])
      }
    }
    const handleFocus = () => {
      setErrorFields((prev) => prev.filter((fieldId) => fieldId !== field.id))
    }

    return (
      <div key={field.id} className={styles.field}>
        <label className={styles.label} htmlFor={field.id}>
          {field.label}
          {field.required && <span className={styles.required}> *</span>}
        </label>
        {field.inputType === 'password' ? (
          <input
            id={field.id}
            className={`${styles.input} ${isInvalid ? styles.invalid : ''}`}
            type="password"
            placeholder={field.placeholder}
            value={value}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
            onBlur={(event) => handleBlur(event.target.value)}
            onFocus={handleFocus}
          />
        ) : (
          <Input
            id={field.id}
            placeholder={field.placeholder}
            value={value}
            isInvalid={isInvalid}
            onChange={onChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
          />
        )}
      </div>
    )
  }

  const renderTemplateField = (field: GithubIssueTemplateField) => {
    const value =
      config.issueState.fields[field.id] ?? getFieldDefaultValue(field)
    const isInvalid = errorFields.includes(field.id)

    if (field.type === 'select') {
      return (
        <div key={field.id} className={styles.field}>
          <label className={styles.label} htmlFor={field.id}>
            {field.label}
            {field.required && <span className={styles.required}> *</span>}
          </label>
          <NativeDropdown
            id={field.id}
            value={value}
            options={(field.options ?? []).map((option) => ({
              id: option,
              label: option,
            }))}
            onChange={(nextValue) => updateIssueField(field.id, nextValue)}
          />
        </div>
      )
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.id} className={styles.field}>
          <label className={styles.label} htmlFor={field.id}>
            {field.label}
            {field.required && <span className={styles.required}> *</span>}
          </label>
          <textarea
            id={field.id}
            className={`${styles.textarea} ${isInvalid ? styles.invalid : ''}`}
            placeholder={field.placeholder || field.description || field.label}
            value={value}
            onChange={(event) => updateIssueField(field.id, event.target.value)}
            onBlur={(event) => {
              if (!event.target.value && field.required) {
                setErrorFields((prev) => [...prev, field.id])
              }
            }}
            onFocus={() => {
              setErrorFields((prev) => prev.filter((id) => id !== field.id))
            }}
            rows={field.id === 'acceptance_criteria' ? 5 : 3}
          />
        </div>
      )
    }

    return renderInputField(
      {
        id: field.id,
        label: field.label,
        placeholder: field.placeholder || field.description || field.label,
        required: field.required,
      },
      value,
      (nextValue) => updateIssueField(field.id, nextValue),
    )
  }

  const getNextConfig = () => ({
    ...config,
    templateFile: selectedTemplateFile,
    preferredTemplateKind,
    handoffType: preferredTemplateKind,
    issueStateByKind: {
      ...config.issueStateByKind,
      [preferredTemplateKind]: config.issueState,
    },
    isEnabled: true,
  })

  const saveConfig = () => {
    if (!isFormValid) {
      setErrorFields(
        visibleRequiredFields.filter((fieldId) => isFieldMissing(fieldId)),
      )
      return
    }

    const nextConfig = getNextConfig()

    setJSONsettingsConfig((prevState) => ({
      ...prevState,
      servers: {
        github: {
          ...prevState.servers.github,
          ...nextConfig,
        },
      },
    }))

    return nextConfig
  }

  const handleSave = () => {
    const nextConfig = saveConfig()

    if (!nextConfig) {
      return
    }

    onSaveSuccess?.()
    setCurrentView('main')
  }

  const handleSaveAndSend = () => {
    const nextConfig = saveConfig()

    if (!nextConfig) {
      return
    }

    onSaveAndSend?.(nextConfig)
  }

  return (
    <Panel hasLeftRightPadding={false} hasTopBottomPadding bottomBorder={false}>
      <Stack hasLeftRightPadding={false}>
        <PanelHeader
          title={
            mode === 'settings'
              ? 'Github settings'
              : preferredTemplateKind === 'primitive'
                ? 'Design Primitive Issue'
                : 'Design Token Issue'
          }
          isActive
          hasBackButton={mode !== 'settings'}
          onClick={() =>
            setCurrentView(mode === 'settings' ? 'settings' : 'main')
          }
        />
      </Stack>

      <Stack hasLeftRightPadding hasTopBottomPadding gap="var(--space-small)">
        <Text className={styles.description}>
          {mode === 'settings'
            ? 'Store the GitHub repository used by design handoff issues.'
            : 'Complete the issue fields for the selected Figma node, then save and send it to GitHub.'}
        </Text>

        {mode === 'settings' && (
          <Stack gap="var(--space-small)">
            {githubSettingFields.map((field) =>
              renderInputField(field, String(config[field.id] ?? ''), (value) =>
                updateConfigField(field.id, value),
              ),
            )}
          </Stack>
        )}

        {mode === 'handoff' && (
          <>
            <Text className={styles.templateHint}>
              Template: {selectedTemplate?.name ?? selectedTemplateFile}
            </Text>
            {missingGithubSettingLabels.length > 0 && (
              <Text className={styles.warning}>
                Configure GitHub settings first:{' '}
                {missingGithubSettingLabels.join(', ')}.
              </Text>
            )}

            <Stack gap="var(--space-small)">
              {issueMetaFields.map((field) =>
                renderInputField(
                  field,
                  String(
                    field.id === 'issueNumber'
                      ? (config.issueState.issueNumber ?? '')
                      : (config[field.id] ?? ''),
                  ),
                  (value) => updateConfigField(field.id, value),
                ),
              )}
            </Stack>

            {selectedTemplate && (
              <Stack gap="var(--space-small)">
                {selectedTemplate.fields
                  .filter((field) => field.id !== 'token_export')
                  .map(renderTemplateField)}
              </Stack>
            )}
          </>
        )}

        <Stack hasTopBottomPadding gap="var(--space-extra-small)">
          <Button
            label={mode === 'handoff' ? 'Save & send' : 'Save'}
            loading={mode === 'handoff' && isSending}
            fullWidth
            onClick={mode === 'handoff' ? handleSaveAndSend : handleSave}
          />
        </Stack>
      </Stack>
    </Panel>
  )
}

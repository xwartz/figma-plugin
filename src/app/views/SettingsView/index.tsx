import { downloadTokensFile } from '@app/api/downloadTokensFile'
import { pushToGithub } from '@app/api/servers/pushToGithub'
import { Toast, type ToastRefI } from '@app/components/Toast'
import { config } from '@app/controller/config'
import { ServerSettingsView } from '@app/views/ServerSettingsView'
import pkg from '@root/package.json'
import React, { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Dropdown,
  Icon,
  Input,
  Panel,
  PanelHeader,
  Stack,
  Text,
  Toggle,
} from 'react-figma-ui/ui'
import styles from './styles.module.css'

type StyleListItemType = {
  id: stylesType
  label: string
  icon: JSX.Element
}

interface ViewProps {
  JSONsettingsConfig: JSONSettingsConfigI
  setJSONsettingsConfig: React.Dispatch<
    React.SetStateAction<JSONSettingsConfigI>
  >
  setCurrentView: React.Dispatch<React.SetStateAction<string>>
  isCodePreviewOpen: boolean
  setIsCodePreviewOpen: React.Dispatch<React.SetStateAction<boolean>>
  setGeneratedTokens: React.Dispatch<React.SetStateAction<SerializableObject>>
  currentView: string
  pluginCommand: PluginMenuCommand | null
  onPluginCommandHandled: () => void
  frameHeight: number
  onResizeHeight: (height: number) => void
  onResetHeight: () => void
  onClearCache: () => void
}

const version = pkg.version
const stylesList = [
  {
    id: 'text',
    label: 'Typography',
    icon: <Icon name="text" size="32" />,
  },
  {
    id: 'grids',
    label: 'Grids',
    icon: <Icon name="grid-styles" size="32" />,
  },
  {
    id: 'effects',
    label: 'Effects',
    icon: <Icon name="effects" size="32" />,
  },
  {
    id: 'colors',
    label: 'Colors',
    icon: <Icon name="color-styles" size="32" />,
  },
] as StyleListItemType[]

export const SettingsView = (props: ViewProps) => {
  const toastRef = React.useRef<ToastRefI>(null)
  const isResizingRef = React.useRef(false)
  const {
    JSONsettingsConfig,
    setJSONsettingsConfig,
    isCodePreviewOpen,
    setIsCodePreviewOpen,
    setGeneratedTokens,
    currentView,
    pluginCommand,
    onPluginCommandHandled,
    setCurrentView,
    frameHeight,
    onResizeHeight,
    onResetHeight,
    onClearCache,
  } = props
  const [isPushing, setIsPushing] = useState(false)
  const [pendingGithubCredentials, setPendingGithubCredentials] =
    useState<GithubCredentialsI>()
  const pendingGithubCredentialsRef = React.useRef<GithubCredentialsI>()
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'design-tokens' | 'github'
  >('design-tokens')

  const handleIncludeFigmaMetaDataChange = useCallback(
    (checked: boolean) => {
      setJSONsettingsConfig((prev) => ({
        ...prev,
        includeFigmaMetaData: checked,
      }))
    },
    [setJSONsettingsConfig],
  )

  const handleIncludeScopesChange = useCallback(
    (checked: boolean) => {
      setJSONsettingsConfig((prev) => ({
        ...prev,
        includeScopes: checked,
      }))
    },
    [setJSONsettingsConfig],
  )

  const handleDTCGKeys = useCallback(
    (checked: boolean) => {
      setJSONsettingsConfig((prev) => ({
        ...prev,
        useDTCGKeys: checked,
      }))
    },
    [setJSONsettingsConfig],
  )

  const handleincludeValueStringKeyToAlias = useCallback(
    (checked: boolean) => {
      setJSONsettingsConfig((prev) => ({
        ...prev,
        includeValueStringKeyToAlias: checked,
      }))
    },
    [setJSONsettingsConfig],
  )

  const handleUsePercentageOpacity = useCallback(
    (checked: boolean) => {
      setJSONsettingsConfig((prev) => ({
        ...prev,
        usePercentageOpacity: checked,
      }))
    },
    [setJSONsettingsConfig],
  )

  const handleShowOutput = () => {
    setIsCodePreviewOpen((prev) => !prev)
    getTokensPreview()
  }

  const startHeightResize = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    const startY = event.clientY
    const startHeight = frameHeight || 600
    isResizingRef.current = true
    document.body.classList.add(styles.resizingCursor)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) {
        return
      }

      const delta = moveEvent.clientY - startY
      onResizeHeight(startHeight + delta)
    }

    const handleMouseUp = () => {
      isResizingRef.current = false
      document.body.classList.remove(styles.resizingCursor)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const getTokensPreview = () => {
    // send command to figma controller
    parent.postMessage(
      {
        pluginMessage: {
          type: 'getTokens',
          role: 'preview',
        } as TokensMessageI,
      },
      '*',
    )
  }

  const getTokensForDownload = () => {
    // send command to figma controller
    parent.postMessage(
      {
        pluginMessage: {
          type: 'getTokens',
          role: 'download',
        } as TokensMessageI,
      },
      '*',
    )
  }

  const getTokensForPush = (credentials?: GithubCredentialsI) => {
    setIsPushing(true)
    setPendingGithubCredentials(credentials)
    pendingGithubCredentialsRef.current = credentials

    const allEnabledServers = Object.keys(JSONsettingsConfig.servers).filter(
      (serverId) => JSONsettingsConfig.servers[serverId].isEnabled,
    )

    // send command to figma controller
    parent.postMessage(
      {
        pluginMessage: {
          type: 'getTokens',
          role: 'push',
          server: allEnabledServers,
        } as TokensMessageI,
      },
      '*',
    )
  }

  const openGithubIssueView = useCallback(
    (preferredTemplateKind: 'token' | 'primitive') => {
      setJSONsettingsConfig((prev) => ({
        ...prev,
        servers: {
          ...prev.servers,
          github: {
            ...prev.servers.github,
            preferredTemplateKind,
            templateFile: '',
          },
        },
      }))
      setCurrentView(
        preferredTemplateKind === 'primitive'
          ? 'github-primitive'
          : 'github-token',
      )
    },
    [setCurrentView, setJSONsettingsConfig],
  )

  const openHelp = useCallback(() => {
    window.open(config.docsLink, '_blank')
  }, [])

  const handleClearCache = useCallback(() => {
    const shouldClearCache = window.confirm(
      'Clear saved plugin settings, GitHub credentials, and handoff form drafts? This cannot be undone.',
    )

    if (!shouldClearCache) {
      return
    }

    onClearCache()
    toastRef.current?.show({
      title: 'Plugin cache cleared',
      message: 'Saved settings have been reset for this Figma account.',
      options: {
        type: 'success',
        timeout: 3000,
      },
    })
  }, [onClearCache])

  const openExportSettings = useCallback(() => {
    setActiveSettingsTab('design-tokens')
    setCurrentView('settings')
  }, [setCurrentView])

  // Receive tokens from figma controller
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.data?.pluginMessage) return
      const { type, tokens, role, server } = event.data
        .pluginMessage as TokensMessageI

      if (type === 'setTokens') {
        if (role === 'preview') {
          setGeneratedTokens(tokens)
        }

        if (role === 'download') {
          downloadTokensFile(tokens, JSONsettingsConfig.splitByCollection)
        }

        if (role === 'push') {
          if (server.includes('github')) {
            const githubCredentials =
              pendingGithubCredentialsRef.current ??
              pendingGithubCredentials ??
              JSONsettingsConfig.servers.github
            await pushToGithub(githubCredentials, tokens, (params) => {
              toastRef.current?.show(params)
            })
          }

          setIsPushing(false)
          setPendingGithubCredentials(undefined)
          pendingGithubCredentialsRef.current = undefined
        }
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [JSONsettingsConfig, pendingGithubCredentials, setGeneratedTokens])

  useEffect(() => {
    if (!pluginCommand) {
      return
    }

    if (pluginCommand === 'export-design-token-json') {
      openExportSettings()
    }

    if (pluginCommand === 'send-design-token-to-issue') {
      openGithubIssueView('token')
    }

    if (pluginCommand === 'send-design-primitive-to-issue') {
      openGithubIssueView('primitive')
    }

    if (pluginCommand === 'settings') {
      setCurrentView('settings')
    }

    if (pluginCommand === 'clear-cache') {
      handleClearCache()
    }

    if (pluginCommand === 'help') {
      openHelp()
    }

    onPluginCommandHandled()
  }, [
    pluginCommand,
    setCurrentView,
    onPluginCommandHandled,
    openHelp,
    openExportSettings,
    openGithubIssueView,
    handleClearCache,
  ])

  //////////////
  useEffect(() => {
    if (!isPushing) {
      return
    }

    const timeout = setTimeout(() => {
      setIsPushing(false)
    }, 10000)

    return () => clearTimeout(timeout)
  }, [isPushing])

  const pluginMenuView = (
    <>
      <Panel bottomBorder={false}>
        <Stack
          className={styles.hero}
          hasLeftRightPadding
          hasTopBottomPadding
          gap="var(--space-small)"
        >
          <Text className={styles.heroText}>
            Export token JSON or create a GitHub issue from the current Figma
            selection.
          </Text>
        </Stack>
      </Panel>

      <Panel bottomBorder={false}>
        <Stack
          hasLeftRightPadding
          hasTopBottomPadding
          gap="var(--space-extra-small)"
        >
          <button
            className={styles.menuItem}
            type="button"
            onClick={openExportSettings}
          >
            <span className={styles.menuIcon}>JSON</span>
            <span className={styles.menuContent}>
              <span className={styles.menuTitle}>Export Design Token Json</span>
              <span className={styles.menuDescription}>
                Review export settings, then download the token JSON file.
              </span>
            </span>
            <span className={styles.menuArrow}>&gt;</span>
          </button>

          <button
            className={styles.menuItem}
            type="button"
            onClick={() => openGithubIssueView('token')}
          >
            <span className={styles.menuIcon}>GH</span>
            <span className={styles.menuContent}>
              <span className={styles.menuTitle}>
                Send Design Token to Issue
              </span>
              <span className={styles.menuDescription}>
                Open the design-token issue template with Figma context filled.
              </span>
            </span>
            <span className={styles.menuArrow}>&gt;</span>
          </button>

          <button
            className={styles.menuItem}
            type="button"
            onClick={() => openGithubIssueView('primitive')}
          >
            <span className={styles.menuIcon}>UI</span>
            <span className={styles.menuContent}>
              <span className={styles.menuTitle}>
                Send Design Primitive to Issue
              </span>
              <span className={styles.menuDescription}>
                Create a primitive handoff issue from the selected component.
              </span>
            </span>
            <span className={styles.menuArrow}>&gt;</span>
          </button>

          <button
            className={styles.menuItem}
            type="button"
            onClick={() => setCurrentView('settings')}
          >
            <span className={styles.menuIcon}>SET</span>
            <span className={styles.menuContent}>
              <span className={styles.menuTitle}>Settings</span>
              <span className={styles.menuDescription}>
                Configure export format, included styles, and GitHub target.
              </span>
            </span>
            <span className={styles.menuArrow}>&gt;</span>
          </button>

          <button className={styles.menuItem} type="button" onClick={openHelp}>
            <span className={styles.menuIcon}>?</span>
            <span className={styles.menuContent}>
              <span className={styles.menuTitle}>Help</span>
              <span className={styles.menuDescription}>
                Open the GitHub repository for docs and support.
              </span>
            </span>
            <span className={styles.menuArrow}>-&gt;</span>
          </button>

          <button
            className={styles.menuItem}
            type="button"
            onClick={handleClearCache}
          >
            <span className={styles.menuIcon}>CLR</span>
            <span className={styles.menuContent}>
              <span className={styles.menuTitle}>Clear Cache</span>
              <span className={styles.menuDescription}>
                Reset saved settings, GitHub credentials, and handoff drafts.
              </span>
            </span>
            <span className={styles.menuArrow}>-&gt;</span>
          </button>
        </Stack>
      </Panel>
    </>
  )

  const settingsView = (
    <>
      <Panel>
        <PanelHeader
          title="Settings"
          onClick={() => setCurrentView('main')}
          iconButtons={[
            {
              children: <span className={styles.backIcon}>&lt;</span>,
              onClick: () => setCurrentView('main'),
            },
          ]}
        />
      </Panel>

      <Panel bottomBorder={false}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeSettingsTab === 'design-tokens' ? styles.activeTab : ''
            }`}
            type="button"
            onClick={() => setActiveSettingsTab('design-tokens')}
          >
            Design tokens
          </button>
          <button
            className={`${styles.tab} ${
              activeSettingsTab === 'github' ? styles.activeTab : ''
            }`}
            type="button"
            onClick={() => setActiveSettingsTab('github')}
          >
            GitHub
          </button>
        </div>
      </Panel>

      {activeSettingsTab === 'design-tokens' && (
        <>
          <Panel bottomBorder={false}>
            <Stack
              className={styles.sectionIntro}
              hasLeftRightPadding
              hasTopBottomPadding
              gap="var(--space-extra-small)"
            >
              <Text className={styles.sectionTitle}>
                Design tokens export settings
              </Text>
              <Text className={styles.sectionDescription}>
                Configure token format, included Figma styles, metadata, and
                JSON output behavior.
              </Text>
            </Stack>
          </Panel>

          <Panel>
            <PanelHeader
              title="Show output"
              onClick={handleShowOutput}
              iconButtons={[
                {
                  children: <Icon name="sidebar" size="32" />,
                  onClick: handleShowOutput,
                },
              ]}
            />
          </Panel>

          <Panel>
            <Stack hasLeftRightPadding>
              <Dropdown
                label="Color mode"
                value={JSONsettingsConfig.colorMode}
                onChange={(value: string) => {
                  setJSONsettingsConfig({
                    ...JSONsettingsConfig,
                    colorMode: value as colorModeType,
                  })
                }}
                optionsSections={[
                  {
                    options: [
                      {
                        id: 'hex',
                        label: 'HEX',
                      },
                    ],
                  },
                  {
                    options: [
                      {
                        id: 'rgba-css',
                        label: 'RGBA CSS',
                      },
                      {
                        id: 'rgba-object',
                        label: 'RGBA Object',
                      },
                    ],
                  },
                  {
                    options: [
                      {
                        id: 'hsla-css',
                        label: 'HSLA CSS',
                      },
                      {
                        id: 'hsla-object',
                        label: 'HSLA Object',
                      },
                    ],
                  },
                ]}
              />
            </Stack>
          </Panel>

          <Panel>
            <PanelHeader title="Include styles" isActive />

            <Stack hasLeftRightPadding={false} hasTopBottomPadding gap={2}>
              {stylesList.map((item) => {
                const configStylesList = JSONsettingsConfig.includedStyles
                const styleItem = configStylesList[item.id] || {
                  isIncluded: false,
                  customName: `${item.label}-styles`,
                }

                // check if style item is included
                const isIncluded = styleItem.isIncluded

                return (
                  <Stack
                    key={item.id}
                    direction="row"
                    gap="var(--space-extra-small)"
                  >
                    <Input
                      className={styles.styleNameInput}
                      id={`style-${item.id}`}
                      hasOutline={false}
                      value={styleItem.customName}
                      leftIcon={item.icon}
                      onChange={(value: string) => {
                        setJSONsettingsConfig({
                          ...JSONsettingsConfig,
                          includedStyles: {
                            ...configStylesList,
                            [item.id]: {
                              ...styleItem,
                              customName: value,
                            },
                          },
                        })
                      }}
                    />
                    <Toggle
                      id={`toggle-${item.id}`}
                      checked={isIncluded}
                      onChange={(checked: boolean) => {
                        setJSONsettingsConfig({
                          ...JSONsettingsConfig,
                          includedStyles: {
                            ...configStylesList,
                            [item.id]: {
                              ...styleItem,
                              isIncluded: checked,
                            },
                          },
                        })
                      }}
                    />
                  </Stack>
                )
              })}
            </Stack>
          </Panel>

          {Object.keys(JSONsettingsConfig.includedStyles).some((styleId) => {
            return JSONsettingsConfig.includedStyles[styleId].isIncluded
          }) && (
            <Panel>
              <Stack hasLeftRightPadding>
                <Dropdown
                  label="Add styles to"
                  value={JSONsettingsConfig.storeStyleInCollection}
                  onChange={(value: string) => {
                    setJSONsettingsConfig({
                      ...JSONsettingsConfig,
                      storeStyleInCollection: value,
                    })
                  }}
                  optionsSections={[
                    {
                      options: [
                        {
                          id: 'none',
                          label: 'Keep separate',
                        },
                      ],
                    },
                    {
                      options: JSONsettingsConfig.variableCollections.map(
                        (collection) => {
                          return {
                            id: collection,
                            label: collection,
                          }
                        },
                      ),
                    },
                  ]}
                />
              </Stack>
            </Panel>
          )}

          <Panel>
            <Stack hasLeftRightPadding>
              <Toggle
                id="split-by-collection"
                checked={JSONsettingsConfig.splitByCollection}
                onChange={(checked: boolean) => {
                  setJSONsettingsConfig({
                    ...JSONsettingsConfig,
                    splitByCollection: checked,
                  })
                }}
              >
                <Text>Split collections into separate files</Text>
              </Toggle>
            </Stack>
          </Panel>

          <Panel>
            <Stack hasLeftRightPadding>
              <Toggle
                id="omit-collection-names"
                checked={JSONsettingsConfig.omitCollectionNames}
                onChange={(checked: boolean) => {
                  setJSONsettingsConfig({
                    ...JSONsettingsConfig,
                    omitCollectionNames: checked,
                  })
                }}
              >
                <Text>Omit collection names</Text>
              </Toggle>
            </Stack>
          </Panel>

          <Panel>
            <Stack>
              <Toggle
                id="scope-feature"
                checked={JSONsettingsConfig.includeScopes}
                onChange={(checked: boolean) => {
                  handleIncludeScopesChange(checked)
                }}
              >
                <Text>Include variable scopes</Text>
              </Toggle>
            </Stack>
          </Panel>

          <Panel>
            <Stack hasLeftRightPadding>
              <Toggle
                id="use-percentage-opacity"
                checked={JSONsettingsConfig.usePercentageOpacity}
                onChange={handleUsePercentageOpacity}
              >
                <Text>Use percentage for opacity</Text>
              </Toggle>
            </Stack>
          </Panel>

          <Panel>
            <Stack hasLeftRightPadding>
              <Toggle
                id="use-dtcg-key"
                checked={JSONsettingsConfig.useDTCGKeys}
                onChange={handleDTCGKeys}
              >
                <Text>Use DTCG keys format</Text>
              </Toggle>
            </Stack>
          </Panel>

          <Panel>
            <Stack hasLeftRightPadding>
              <Toggle
                id="include-value-alias-string"
                checked={JSONsettingsConfig.includeValueStringKeyToAlias}
                onChange={handleincludeValueStringKeyToAlias}
              >
                <Text>
                  Include <span className={styles.codeLine}>.value</span> string
                  for aliases
                </Text>
              </Toggle>
            </Stack>
          </Panel>

          <Panel>
            <Stack>
              <Toggle
                id="scope-feature"
                checked={JSONsettingsConfig.includeFigmaMetaData}
                onChange={(checked: boolean) => {
                  handleIncludeFigmaMetaDataChange(checked)
                }}
              >
                <Text>Include figma metadata</Text>
              </Toggle>
            </Stack>
          </Panel>

          <Panel hasLeftRightPadding bottomBorder={false}>
            <Stack
              className={styles.downloadPanel}
              hasLeftRightPadding
              hasTopBottomPadding
              gap="var(--space-small)"
            >
              <Text className={styles.sectionDescription}>
                Download the current Figma variables as JSON file using the
                settings above.
              </Text>
              <Button
                label="Download"
                onClick={getTokensForDownload}
                fullWidth
              />
            </Stack>
          </Panel>
        </>
      )}

      {activeSettingsTab === 'github' && (
        <ServerSettingsView
          JSONsettingsConfig={JSONsettingsConfig}
          setJSONsettingsConfig={setJSONsettingsConfig}
          setCurrentView={setCurrentView}
          server="github"
          mode="settings"
          onSaveSuccess={() => {
            toastRef.current?.show({
              title: 'GitHub settings saved',
              message: 'Your GitHub repository settings have been saved.',
              options: {
                type: 'success',
                timeout: 3000,
              },
            })
          }}
        />
      )}
    </>
  )

  const commonProps = {
    JSONsettingsConfig,
    setJSONsettingsConfig,
    setCurrentView,
  }

  const selectRender = () => {
    if (currentView === 'main') {
      return pluginMenuView
    }

    if (currentView === 'settings') {
      return settingsView
    }

    if (currentView === 'github-token') {
      return (
        <ServerSettingsView
          {...commonProps}
          server="github"
          mode="handoff"
          handoffKind="token"
          isSending={isPushing}
          onSaveAndSend={getTokensForPush}
        />
      )
    }

    if (currentView === 'github-primitive') {
      return (
        <ServerSettingsView
          {...commonProps}
          server="github"
          mode="handoff"
          handoffKind="primitive"
          isSending={isPushing}
          onSaveAndSend={getTokensForPush}
        />
      )
    }
  }

  return (
    <>
      <Toast ref={toastRef} />
      <Stack
        className={`${styles.settingView} ${
          isCodePreviewOpen ? styles.fitHighToFrame : ''
        }`}
        hasLeftRightPadding={false}
      >
        <div className={styles.dynamicContent}>{selectRender()}</div>

        <Panel
          hasTopBottomPadding
          hasLeftRightPadding
          topBorder
          bottomBorder={false}
        >
          <Stack direction="row" className={styles.about}>
            <a href={config.docsLink} target="_blank" rel="noopener">
              <Text>Documentation</Text>
            </a>
            <a href={config.changelogLink} target="_blank" rel="noopener">
              <Text>v.{version}</Text>
            </a>
          </Stack>
        </Panel>

        <button
          type="button"
          aria-label="Resize plugin height"
          className={styles.heightResizer}
          onMouseDown={startHeightResize}
          onDoubleClick={onResetHeight}
          title="Drag to resize. Double-click to auto-fit"
        />
      </Stack>
    </>
  )
}

import React, { useEffect, useState } from 'react'

import styles from './styles.module.css'
import { CodePreviewView } from './views/CodePreviewView'
import { EmptyView } from './views/EmptyView'
import { LoadingView } from './views/LoadingView'
import { SettingsView } from './views/SettingsView'

const getDefaultSettingsConfig = (): JSONSettingsConfigI => ({
  includedStyles: {
    text: {
      isIncluded: false,
      customName: 'Typography-styles',
    },
    effects: {
      isIncluded: false,
      customName: 'Effect-styles',
    },
    grids: {
      isIncluded: false,
      customName: 'Grid-styles',
    },
    colors: {
      isIncluded: false,
      customName: 'Color-styles',
    },
  },
  variableCollections: [],
  storeStyleInCollection: 'none',
  colorMode: 'rgba-css',
  includeScopes: true,
  useDTCGKeys: true,
  includeValueStringKeyToAlias: false,
  includeFigmaMetaData: true,
  usePercentageOpacity: false,
  splitByCollection: false,
  omitCollectionNames: false,
  servers: {
    github: {
      isEnabled: false,
      token: '',
      repo: '',
      branch: 'design-system-exports',
      fileName: 'issues/<issue-number>/design-tokens.json',
      owner: '',
      commitMessage: 'chore(design): update design tokens',
      templateFile: '',
      preferredTemplateKind: 'token',
      handoffType: 'token',
      issueStateByKind: {},
    },
  },
})

const Container = () => {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const hasSyncedSettingsRef = React.useRef(false)
  const hasSyncedPreviewRef = React.useRef(false)
  const previewHeightRef = React.useRef(0)

  const [generatedTokens, setGeneratedTokens] = useState<SerializableObject>({})

  const [isLoading, setIsLoading] = useState(true)

  const [frameHeight, setFrameHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [manualFrameHeight, setManualFrameHeight] = useState<number | null>(
    null,
  )
  const [isCodePreviewOpen, setIsCodePreviewOpen] = useState(false)

  const [currentView, setCurrentView] = useState('main')
  const [pluginCommand, setPluginCommand] = useState<PluginMenuCommand | null>(
    null,
  )
  const [fileHasVariables, setFileHasVariables] = useState(false)

  const [JSONsettingsConfig, setJSONsettingsConfig] = useState(
    getDefaultSettingsConfig,
  )

  const commonProps = {
    JSONsettingsConfig,
    setJSONsettingsConfig,
    setCurrentView,
  }

  // Get all collections from Figma
  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: 'checkForVariables' } }, '*')

    window.onmessage = (event) => {
      const { type, hasVariables, variableCollections, storageConfig } =
        event.data.pluginMessage

      // check if file has variables
      if (type === 'checkForVariables') {
        setFileHasVariables(hasVariables)
        setIsLoading(false)

        if (hasVariables) {
          setJSONsettingsConfig((prev) => ({
            ...prev,
            variableCollections,
          }))
        }
      }

      // check storage on load
      if (type === 'storageConfig') {
        if (storageConfig) {
          setJSONsettingsConfig((prev) => ({
            ...prev,
            ...storageConfig,
            servers: {
              github: storageConfig.servers?.github ?? prev.servers.github,
            },
            // Ensure new properties have defaults for backward compatibility
            colorMode: storageConfig.colorMode ?? prev.colorMode,
            includeScopes: storageConfig.includeScopes ?? prev.includeScopes,
            useDTCGKeys: storageConfig.useDTCGKeys ?? prev.useDTCGKeys,
            includeFigmaMetaData:
              storageConfig.includeFigmaMetaData ?? prev.includeFigmaMetaData,
            splitByCollection: storageConfig.splitByCollection ?? false,
          }))
        }
      }
    }
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data?.pluginMessage as TokensMessageI | undefined

      if (message?.type !== 'pluginCommand' || !message.command) {
        return
      }

      setPluginCommand(message.command)
    }

    window.addEventListener('message', handleMessage)
    parent.postMessage(
      {
        pluginMessage: {
          type: 'uiReady',
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
  }, [])

  // Check if the view was changed
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const { height } = entries[0].contentRect

      // Don't track content height while preview is open — the flex row
      // includes the preview pane and doesn't represent SettingsView height.
      if (isCodePreviewOpen) return

      setContentHeight(height)
      setFrameHeight(height)

      if (manualFrameHeight !== null) return

      parent.postMessage(
        {
          pluginMessage: {
            type: 'resizeUIHeight',
            height,
          },
        },
        '*',
      )
    })

    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [isCodePreviewOpen, manualFrameHeight])

  useEffect(() => {
    if (manualFrameHeight === null) {
      return
    }

    parent.postMessage(
      {
        pluginMessage: {
          type: 'resizeUIHeight',
          height: manualFrameHeight,
        },
      },
      '*',
    )
  }, [manualFrameHeight])

  useEffect(() => {
    if (manualFrameHeight === null || contentHeight <= 0) {
      return
    }

    const maxHeight = Math.max(360, Math.round(contentHeight))

    if (manualFrameHeight > maxHeight) {
      setManualFrameHeight(maxHeight)
      setFrameHeight(maxHeight)
    }
  }, [manualFrameHeight, contentHeight])

  useEffect(() => {
    previewHeightRef.current = manualFrameHeight ?? frameHeight
  }, [manualFrameHeight, frameHeight])

  useEffect(() => {
    if (!hasSyncedSettingsRef.current) {
      hasSyncedSettingsRef.current = true
      return
    }

    parent.postMessage(
      {
        pluginMessage: {
          type: 'JSONSettingsConfig',
          config: JSONsettingsConfig,
        },
      },
      '*',
    )
  }, [JSONsettingsConfig])

  useEffect(() => {
    if (!hasSyncedPreviewRef.current) {
      hasSyncedPreviewRef.current = true
      return
    }

    parent.postMessage(
      {
        pluginMessage: {
          type: 'openCodePreview',
          isCodePreviewOpen,
          height: previewHeightRef.current,
        },
      },
      '*',
    )
  }, [isCodePreviewOpen])

  const handleResizeHeight = (height: number) => {
    const maxHeight = Math.max(360, Math.round(contentHeight || frameHeight))
    const nextHeight = Math.round(Math.max(360, Math.min(height, maxHeight)))
    setManualFrameHeight(nextHeight)
    setFrameHeight(nextHeight)
  }

  const handleResetHeight = () => {
    const nextHeight = Math.max(360, Math.round(contentHeight))
    setManualFrameHeight(null)
    setFrameHeight(nextHeight)

    parent.postMessage(
      {
        pluginMessage: {
          type: 'resizeUIHeight',
          height: nextHeight,
        },
      },
      '*',
    )
  }

  const handleClearCache = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: 'clearStorageConfig',
          tokens: null,
          role: 'preview',
          server: [],
        } as TokensMessageI,
      },
      '*',
    )

    setJSONsettingsConfig((prev) => ({
      ...getDefaultSettingsConfig(),
      variableCollections: prev.variableCollections,
    }))
  }

  const renderView = () => {
    if (isLoading) {
      return <LoadingView />
    }

    if (!fileHasVariables) {
      return <EmptyView setFileHasVariables={setFileHasVariables} />
    }

    return (
      <SettingsView
        {...commonProps}
        isCodePreviewOpen={isCodePreviewOpen}
        setIsCodePreviewOpen={setIsCodePreviewOpen}
        setGeneratedTokens={setGeneratedTokens}
        currentView={currentView}
        pluginCommand={pluginCommand}
        onPluginCommandHandled={() => setPluginCommand(null)}
        frameHeight={manualFrameHeight ?? frameHeight}
        onResizeHeight={handleResizeHeight}
        onResetHeight={handleResetHeight}
        onClearCache={handleClearCache}
      />
    )
  }

  return (
    <div ref={wrapperRef} className={styles.container}>
      {renderView()}
      {isCodePreviewOpen && (
        <CodePreviewView generatedTokens={generatedTokens} />
      )}
    </div>
  )
}

export default Container

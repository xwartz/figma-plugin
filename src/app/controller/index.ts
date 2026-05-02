import { PluginAPIResolver } from '@app/api/pluginApiResolver'
import { getTokens } from '@common/export'
import { checkForVariables } from './checkForVariables'
import { config } from './config'
import { getStorageConfig } from './getStorageConfig'

const pluginConfigKey = 'design-handoff-bridge-config'

let isCodePreviewOpen = false

const frameWidthWithCodePreview = 800
const frameWidth = isCodePreviewOpen
  ? frameWidthWithCodePreview
  : config.frameWidth

figma.showUI(__html__, {
  width: frameWidth,
  height: 600,
  themeColors: true,
})

let JSONSettingsConfig: JSONSettingsConfigI
const pluginCommand = figma.command as PluginMenuCommand

if (pluginCommand === 'help') {
  figma.openExternal(config.docsLink)
  figma.closePlugin()
}

function getCurrentFigmaContext(): FigmaSelectionContextI {
  const selectedNode = figma.currentPage.selection[0]
  const nodeId = selectedNode?.id

  return {
    nodeId,
    nodeName: selectedNode?.name,
    nodeType: selectedNode?.type,
    pageName: figma.currentPage.name,
    selectedNodeCount: figma.currentPage.selection.length,
  }
}

function postCurrentFigmaContext() {
  figma.ui.postMessage({
    type: 'setFigmaContext',
    tokens: null,
    role: 'preview',
    server: [],
    figmaContext: getCurrentFigmaContext(),
  } as TokensMessageI)
}

figma.on('selectionchange', () => {
  postCurrentFigmaContext()
})

// listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'uiReady') {
    await getStorageConfig(pluginConfigKey, pluginCommand || undefined)
    return
  }

  await checkForVariables(msg.type)

  // get JSON settings config from UI and store it in a variable
  if (msg.type === 'JSONSettingsConfig') {
    JSONSettingsConfig = msg.config

    await figma.clientStorage.setAsync(
      pluginConfigKey,
      JSON.stringify(JSONSettingsConfig),
    )
  }

  if (msg.type === 'clearStorageConfig') {
    JSONSettingsConfig = undefined
    await figma.clientStorage.setAsync(pluginConfigKey, null)
  }

  // generate tokens and send them to the UI
  if (msg.type === 'getTokens') {
    await getTokens(
      new PluginAPIResolver(),
      JSONSettingsConfig,
      JSONSettingsConfig,
    ).then((tokens) => {
      figma.ui.postMessage({
        type: 'setTokens',
        tokens: tokens,
        role: msg.role,
        server: msg.server,
      } as TokensMessageI)
    })
  }

  if (msg.type === 'getFigmaContext') {
    postCurrentFigmaContext()
  }

  // change size of UI
  if (msg.type === 'resizeUIHeight') {
    const currentWidth = isCodePreviewOpen
      ? frameWidthWithCodePreview
      : config.frameWidth
    figma.ui.resize(currentWidth, Math.round(msg.height))
  }

  if (msg.type === 'openCodePreview') {
    isCodePreviewOpen = msg.isCodePreviewOpen
    const nextWidth = isCodePreviewOpen
      ? frameWidthWithCodePreview
      : config.frameWidth
    figma.ui.resize(nextWidth, Math.round(msg.height))
  }
}

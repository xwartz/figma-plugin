import { checkForVariables } from './checkForVariables'
import { getStorageConfig } from './getStorageConfig'

// import { removeDollarSign } from "../utils/removeDollarSign";

import { PluginAPIResolver } from '@app/api/pluginApiResolver'
import { getTokens } from '@common/export'
import { config } from './config'

// clear console on reload
console.clear()

const pluginConfigKey = 'design-handoff-bridge-config'
getStorageConfig(pluginConfigKey)
//
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
let didSendPluginCommand = false

function sendPluginCommand() {
  if (!pluginCommand || pluginCommand === 'help' || didSendPluginCommand) {
    return
  }

  didSendPluginCommand = true
  figma.ui.postMessage({
    type: 'pluginCommand',
    tokens: null,
    role: 'preview',
    server: [],
    command: pluginCommand,
  } as TokensMessageI)
}

if (pluginCommand === 'help') {
  figma.openExternal(config.docsLink)
  figma.closePlugin()
} else if (pluginCommand) {
  setTimeout(sendPluginCommand, 50)
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
    sendPluginCommand()
    return
  }

  await checkForVariables(msg.type)

  // get JSON settings config from UI and store it in a variable
  if (msg.type === 'JSONSettingsConfig') {
    // update JSONSettingsConfig
    JSONSettingsConfig = msg.config

    // console.log("updated JSONSettingsConfig received", JSONSettingsConfig);

    // handle client storage
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

import type { IResolver } from './resolver'
import { mergeStylesIntoTokens } from './transform/mergeStylesIntoTokens'
import { stylesToTokens } from './transform/styles/stylesToTokens'
import { variablesToTokens } from './transform/variablesToTokens'

const buildMeta = (
  config: ExportSettingsI,
  state?: PluginStateI,
): MetaPropsI => ({
  useDTCGKeys: config.useDTCGKeys,
  colorMode: config.colorMode,
  variableCollections: state?.variableCollections,
  createdAt: new Date().toISOString(),
})

export const getTokens = async (
  resolver: IResolver,
  config: ExportSettingsI,
  state?: PluginStateI,
) => {
  const variableCollection = await resolver.getLocalVariableCollections()
  const variables = await resolver.getLocalVariables()

  // convert variables to tokens
  const variableTokens = await variablesToTokens(
    variables,
    variableCollection,
    config,
    resolver,
  )

  // convert styles to tokens
  const styleTokens = await stylesToTokens(config, resolver)

  // merge variables and styles
  const mergedVariables = mergeStylesIntoTokens(
    variableTokens,
    styleTokens,
    config.storeStyleInCollection,
  )

  const metaData = buildMeta(config, state)

  if (config.splitByCollection) {
    // Return a map of { collectionName: tokens } where each entry gets its own meta
    const result: Record<string, SerializableObject> = {}
    for (const key of Object.keys(mergedVariables)) {
      const collectionTokens = mergedVariables[key]

      if (
        typeof collectionTokens !== 'object' ||
        collectionTokens === null ||
        Array.isArray(collectionTokens)
      ) {
        continue
      }

      result[key] = {
        ...collectionTokens,
        $extensions: { 'design-handoff-bridge-meta': metaData },
      }
    }
    return result
  }

  // add meta to mergedVariables
  mergedVariables.$extensions = {
    'design-handoff-bridge-meta': metaData,
  }

  return mergedVariables
}

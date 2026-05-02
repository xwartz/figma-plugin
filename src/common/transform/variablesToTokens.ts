import type { IResolver } from '@common/resolver'
import { getTokenKeyName } from './getTokenKeyName'
import { groupObjectNamesIntoCategories } from './groupObjectNamesIntoCategories'
import { normalizeValue } from './normalizeValue'
import { normilizeType } from './normilizeType'

export const variablesToTokens = async (
  variables: Variable[],
  collections: VariableCollection[],
  config: ExportSettingsI,
  resolver: IResolver,
) => {
  const {
    colorMode,
    useDTCGKeys,
    includeValueStringKeyToAlias,
    includeFigmaMetaData,
    usePercentageOpacity,
    omitCollectionNames = false,
  } = config
  const keyNames = getTokenKeyName(useDTCGKeys)

  let emptyCollection: Array<Record<string, SerializableObject>> =
    collections.map((collection) => {
      return {
        [collection.name]: {},
      }
    })

  // When omitting collection names, use a single flat object for all variables
  const flatVariables: SerializableObject = {}
  const seenVariableNames = new Set<string>()

  for (const variable of variables) {
    const collectionId = variable.variableCollectionId
    const collectionEntry = collections.find(
      (collection) => collection.id === collectionId,
    )

    if (!collectionEntry) {
      console.warn(
        `[design-handoff-bridge] Skipping variable "${variable.name}" because collection ${collectionId} was not found.`,
      )
      continue
    }

    const collectionName = collectionEntry.name
    const collectionDefaultModeId = collectionEntry.defaultModeId
    const collectionObject = {
      id: collectionId,
      name: collectionName,
      defaultModeId: collectionDefaultModeId,
    }

    // get values by mode
    const modes = variable.valuesByMode

    const getValue = async (modeIndex: number) =>
      await normalizeValue(
        {
          variableType: variable.resolvedType,
          variableValue: variable.valuesByMode[Object.keys(modes)[modeIndex]],
          variableScope: variable.scopes,
          colorMode,
          useDTCGKeys,
          includeValueStringKeyToAlias,
          usePercentageOpacity,
          omitCollectionNames,
        },
        resolver,
      )

    const defaultValue = await getValue(
      Object.keys(modes).indexOf(collectionDefaultModeId),
    )

    const modesValues = Object.fromEntries(
      (
        await Promise.all(
          Object.keys(modes).map(async (modeId, index) => {
            const modeName = collectionEntry.modes.find(
              (mode) => mode.modeId === modeId,
            )?.name

            if (modeName) {
              return [[modeName, await getValue(index)]]
            }
            console.warn(`ModeId ${modeId} not found in ${collectionId}`)
            return []
          }),
        )
      ).flat(),
    ) as Record<string, SerializableValue>

    const filteredModesValues =
      Object.keys(modesValues).length === 1 ? {} : modesValues

    const variableObject = {
      [keyNames.type]: normilizeType(
        variable.resolvedType,
        variable.scopes,
        usePercentageOpacity,
      ),
      [keyNames.value]: defaultValue,
      [keyNames.description]: variable.description,
      // add scopes if true
      ...(config.includeScopes && {
        scopes: variable.scopes,
      }),
      // add meta
      $extensions: {
        mode: filteredModesValues,
        ...(includeFigmaMetaData && {
          figma: {
            codeSyntax: variable.codeSyntax,
            variableId: variable.id,
            collection: collectionObject,
          },
        }),
      },
    } as PluginTokenI

    if (omitCollectionNames) {
      // Place variable into flat object; warn on collision
      if (seenVariableNames.has(variable.name)) {
        console.warn(
          `[design-handoff-bridge] Collision: variable "${variable.name}" exists in multiple collections. Last value wins.`,
        )
      }
      seenVariableNames.add(variable.name)
      flatVariables[variable.name] = variableObject
    } else {
      // place variable into collection
      emptyCollection = emptyCollection.map((collection) => {
        if (Object.keys(collection)[0] === collectionName) {
          collection[collectionName][variable.name] = variableObject
        }
        return collection
      })
    }
  }

  if (omitCollectionNames) {
    return groupObjectNamesIntoCategories(flatVariables)
  }

  const mergedVariables: SerializableObject = {}
  emptyCollection.forEach((collection) => {
    Object.assign(mergedVariables, collection)
  })

  return groupObjectNamesIntoCategories(mergedVariables)
}

export const checkForVariables = async (msgType: string) => {
  if (msgType === 'checkForVariables') {
    const variables =
      (await figma.variables.getLocalVariablesAsync()) as Variable[]
    const variableCollections =
      (await figma.variables.getLocalVariableCollectionsAsync()) as VariableCollection[]
    const collectionNames = variableCollections.map((collection) => {
      return collection.name
    })

    figma.ui.postMessage({
      type: 'checkForVariables',
      hasVariables: variables.length > 0,
      variableCollections: collectionNames,
    })
  }
}

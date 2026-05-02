const isSerializableObject = (
  value: SerializableValue,
): value is SerializableObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const mergeStylesIntoTokens = (
  variableTokens: SerializableObject,
  styleTokens: SerializableObject[],
  storeStyleInCollection: string,
) => {
  let target = variableTokens

  if (storeStyleInCollection && storeStyleInCollection !== 'none') {
    const collectionTokens = variableTokens[storeStyleInCollection]

    if (!isSerializableObject(collectionTokens)) {
      variableTokens[storeStyleInCollection] = {}
    }

    target = variableTokens[storeStyleInCollection] as SerializableObject
  }

  styleTokens.forEach((styleToken) => {
    Object.assign(target, styleToken)
  })

  return variableTokens
}

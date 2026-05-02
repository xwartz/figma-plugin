import { countTokens } from './countTokens'

const isSerializableObject = (
  value: SerializableValue,
): value is SerializableObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const getTokensStat = (tokens: SerializableObject) => {
  // get lines count
  const codeLines = JSON.stringify(tokens, null, 2).split('\n').length

  // get groups count
  const groupsCount = Object.values(tokens).reduce((acc, group) => {
    if (!isSerializableObject(group)) {
      return acc
    }

    return acc + Object.keys(group).length
  }, 0)

  const tokensCount = countTokens(tokens)

  // count size in bytes
  const size = new TextEncoder().encode(JSON.stringify(tokens)).length

  return {
    codeLines,
    groupsCount,
    tokensCount,
    size,
  }
}

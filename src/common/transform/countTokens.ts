const isSerializableObject = (
  value: SerializableValue,
): value is SerializableObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const countTokens = (obj: SerializableValue) => {
  let count = 0

  function traverse(value: SerializableValue) {
    if (!isSerializableObject(value)) {
      return
    }

    for (const key in value) {
      if (key === '$value' || key === 'value') {
        count++
      } else if (typeof value[key] === 'object' && value[key] !== null) {
        traverse(value[key])
      }
    }
  }

  traverse(obj)
  return count
}

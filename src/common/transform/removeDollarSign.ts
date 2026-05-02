const isSerializableObject = (
  value: SerializableValue,
): value is SerializableObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const removeDollarSign = (obj: SerializableValue): SerializableValue => {
  if (!isSerializableObject(obj) && !Array.isArray(obj)) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(removeDollarSign)
  }

  const result: SerializableObject = {}

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      let newKey = key

      if (
        key.startsWith('$') &&
        ['value', 'type', 'description', 'extensions'].includes(key.slice(1))
      ) {
        newKey = key.slice(1)
      }

      result[newKey] = removeDollarSign(obj[key])
    }
  }

  return result
}

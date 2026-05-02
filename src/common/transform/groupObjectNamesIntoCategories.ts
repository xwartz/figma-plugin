const isSerializableObject = (
  value: SerializableValue,
): value is SerializableObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const groupObjectNamesIntoCategories = (
  inputObject: SerializableObject,
) => {
  const result: SerializableObject = {}

  for (const [key, value] of Object.entries(inputObject)) {
    const parts = key.split('/')
    let current = result

    for (let index = 0; index < parts.length; index++) {
      const part = parts[index]

      if (index === parts.length - 1) {
        current[part] = value
        continue
      }

      if (!isSerializableObject(current[part])) {
        current[part] = {}
      }

      current = current[part] as SerializableObject
    }
  }

  for (const [prop, value] of Object.entries(result)) {
    if (isSerializableObject(value)) {
      result[prop] = groupObjectNamesIntoCategories(value)
    }
  }

  return result
}

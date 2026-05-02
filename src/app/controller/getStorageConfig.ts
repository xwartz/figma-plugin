export const getStorageConfig = async (key: string) => {
  const storageVersionKey = 'design-handoff-bridge-storage'
  const actualStorageVersion = 'v1'

  const storedVersion = await figma.clientStorage.getAsync(storageVersionKey)

  // clear storage if storage version is different
  if (storedVersion && storedVersion !== actualStorageVersion) {
    figma.clientStorage.setAsync(key, null)
    await figma.clientStorage.setAsync(storageVersionKey, actualStorageVersion)
  }

  const storedConfig = await figma.clientStorage.getAsync(key)

  if (typeof storedConfig !== 'string') {
    figma.ui.postMessage({
      type: 'storageConfig',
      storageConfig: null,
    })
    return
  }

  try {
    figma.ui.postMessage({
      type: 'storageConfig',
      storageConfig: JSON.parse(storedConfig),
    })
  } catch {
    figma.ui.postMessage({
      type: 'storageConfig',
      storageConfig: null,
    })
  }
}

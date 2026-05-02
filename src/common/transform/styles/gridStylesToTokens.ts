import type { IResolver } from '@common/resolver'
import { getTokenKeyName } from '@common/transform/getTokenKeyName'
import { groupObjectNamesIntoCategories } from '@common/transform/groupObjectNamesIntoCategories'

export const gridStylesToTokens = async (
  customName: string,
  isDTCGForamt: boolean,
  resolver: IResolver,
) => {
  const keyNames = getTokenKeyName(isDTCGForamt)
  const gridStyles = await resolver.getLocalGridStyles()

  const textTokens = {}

  const allGridStyles = gridStyles.reduce((result, style) => {
    const styleName = style.name
    const firstTwoGrids = style.layoutGrids.slice(0, 2) as RowsColsLayoutGrid[]

    const columnGrid = firstTwoGrids[0]
    const rowGrid = firstTwoGrids[1]

    const styleObject = {
      [keyNames.type]: 'grid',
      [keyNames.value]: {
        columnCount: columnGrid?.count,
        columnGap: columnGrid?.gutterSize
          ? `${columnGrid?.gutterSize}px`
          : undefined,
        columnWidth: columnGrid?.sectionSize
          ? `${columnGrid?.sectionSize}px`
          : undefined,
        columnMargin: columnGrid?.offset
          ? `${columnGrid?.offset}px`
          : undefined,
        rowCount: rowGrid?.count,
        rowGap: rowGrid?.gutterSize ? `${rowGrid?.gutterSize}px` : undefined,
        rowHeight: rowGrid?.sectionSize
          ? `${rowGrid?.sectionSize}px`
          : undefined,
        rowMargin: rowGrid?.offset ? `${rowGrid?.offset}px` : undefined,
      },
    } as unknown as GridTokenI

    result[styleName] = styleObject

    return result
  }, {})
  textTokens[customName] = groupObjectNamesIntoCategories(allGridStyles)

  return textTokens
}

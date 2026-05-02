import type { IResolver } from '@common/resolver'
import Decimal from 'decimal.js'
import { convertRGBA } from './color/convertRGBA'
import { getAliasVariableName } from './getAliasVariableName'

interface PropsI {
  variableValue: VariableValue
  variableType: VariableResolvedDataType
  variableScope: VariableScope[]
  colorMode: colorModeType
  useDTCGKeys: boolean
  includeValueStringKeyToAlias: boolean
  usePercentageOpacity: boolean
  omitCollectionNames?: boolean
}

export const normalizeValue = async (props: PropsI, resolver: IResolver) => {
  const {
    variableValue,
    variableType,
    variableScope,
    colorMode,
    useDTCGKeys,
    includeValueStringKeyToAlias,
    usePercentageOpacity,
    omitCollectionNames = false,
  } = props

  if (
    typeof variableValue === 'object' &&
    variableValue !== null &&
    'type' in variableValue &&
    variableValue.type === 'VARIABLE_ALIAS'
  ) {
    const aliasVariableName = await getAliasVariableName(
      variableValue.id,
      useDTCGKeys,
      includeValueStringKeyToAlias,
      resolver,
      omitCollectionNames,
    )

    return aliasVariableName
  }

  if (variableType === 'COLOR') {
    return convertRGBA(variableValue as RGBA, colorMode)
  }

  if (variableType === 'FLOAT') {
    const numericValue = Number(variableValue)

    if (variableScope.length === 1 && variableScope[0] === 'FONT_WEIGHT') {
      return `${variableValue}`
    } else if (variableScope.length === 1 && variableScope[0] === 'OPACITY') {
      if (usePercentageOpacity) {
        return `${numericValue}%`
      } else {
        return numericValue / 100
      }
    } else {
      return `${new Decimal(numericValue).toDecimalPlaces(6).toNumber()}px`
    }
  }

  return variableValue
}

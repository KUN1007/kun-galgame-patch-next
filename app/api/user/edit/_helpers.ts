import * as Diff from 'diff'

export const generatePatchDiff = (patch: any, input: any): string => {
  const diffResult: string[] = []

  diffResult.push(_diffField('name', patch.name, input.name))
  diffResult.push(
    _diffField('alias', patch.alias.join(','), input.alias?.join(',') || '')
  )
  diffResult.push(
    _diffField('introduction', patch.introduction, input.introduction)
  )
  return diffResult.join('\n')
}

const _diffField = (
  field: string,
  oldValue: string,
  newValue: string
): string => {
  const diff = Diff.diffWords(oldValue, newValue)
  let result = `${field}:\n`

  diff.forEach((part) => {
    if (part.added) {
      result += `+++${part.value}+++`
    } else if (part.removed) {
      result += `---${part.value}---`
    } else {
      result += `|||${part.value}|||`
    }
  })

  return result
}

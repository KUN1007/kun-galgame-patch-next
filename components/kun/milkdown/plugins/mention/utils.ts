import { Ctx } from '@milkdown/ctx'
import { linkSchema } from '@milkdown/preset-commonmark'
import { Selection } from '@milkdown/prose/state'

export type MentionsPluginAttrs = {
  range: {
    to: number
    from: number
  }
  queryText: string | undefined
}

const mentionsRegex = new RegExp('(^|\\s)@([\\w-\\+]+)$')
export const computeStateFromSelection = (
  ctx: Ctx,
  selection: Selection
): MentionsPluginAttrs | undefined => {
  const { $from } = selection

  const parastart = $from.before()
  const text = $from.doc.textBetween(parastart, $from.pos, '\n', '\0')
  const match = text.match(mentionsRegex)

  if (match) {
    const { index = 0 } = match
    const [value, , queryText] = match

    match.index = value.startsWith(' ') ? index + 1 : match.index
    match[0] = value.trim()

    const from = $from.start() + (match.index as number)
    const to = from + match[0].length

    const isLink = $from.doc.rangeHasMark(from, to, linkSchema.type(ctx))

    if (isLink) {
      return undefined
    }

    return {
      range: { from, to },
      queryText: queryText
    }
  }

  return undefined
}

export const getInitState = (): MentionsPluginAttrs => ({
  range: {
    to: 0,
    from: 0
  },
  queryText: ''
})

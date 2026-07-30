import { diffWords } from 'diff'

// Word-level text diff for the resource change history.
//
// Backed by jsdiff (npm `diff`, BSD-3), the de-facto standard implementation,
// rather than a hand-rolled LCS: it already coalesces runs, handles the
// whitespace-vs-token distinction, and is the same engine the GitHub-style
// viewers build on.
//
// The presentation this feeds is a UNIFIED inline diff — one block with only the
// changed runs tinted — not the before/after columns it replaced. Two columns
// showing a whole field twice cannot answer "what changed": a one-character edit
// inside a 400-character note is invisible in it. Word-level highlighting is the
// industry norm for exactly this (line-level for code, intra-line word
// highlighting for prose).

export type TextDiffOp = 'equal' | 'insert' | 'delete'

export interface TextDiffSegment {
  op: TextDiffOp
  text: string
}

// CJK word segmentation.
//
// jsdiff's default tokenizer is regex-based and splits on whitespace, so for
// Chinese / Japanese — which have none — it falls back to per-character
// boundaries. That still finds the change, but it cuts words in half:
//   我喜[-欢][+爱]这个游戏      (no segmenter)
//   我[-喜欢][+喜爱]这个游戏    (zh segmenter)
// The second is what a reader actually parses, so pass a segmenter. Upstream
// recommends this for languages without spaces.
//
// Built once and reused — constructing an Intl.Segmenter is not free, and this
// runs per change per revision. `zh` also segments Japanese kana runs sensibly,
// and the notes are overwhelmingly Chinese.
//
// The capability check is not defensiveness for its own sake: an absent
// Intl.Segmenter would throw inside a render function and blank the whole
// history section, and losing word alignment is a far better outcome than that.
let segmenter: Intl.Segmenter | null | undefined

const wordSegmenter = (): Intl.Segmenter | null => {
  if (segmenter !== undefined) return segmenter
  segmenter =
    typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
      ? new Intl.Segmenter('zh', { granularity: 'word' })
      : null
  return segmenter
}

// diffTextSegments turns a before/after pair into the runs to render.
// Identical inputs collapse to a single `equal` run (or nothing when both are
// empty), so callers can treat "no visible change" uniformly.
export const diffTextSegments = (
  before: string,
  after: string
): TextDiffSegment[] => {
  const a = before ?? ''
  const b = after ?? ''
  if (!a && !b) return []
  if (a === b) return [{ op: 'equal', text: a }]

  const seg = wordSegmenter()
  const parts = diffWords(a, b, seg ? { intlSegmenter: seg } : undefined)

  return parts.map((p) => ({
    op: p.added ? 'insert' : p.removed ? 'delete' : 'equal',
    text: p.value
  }))
}

// diffTextStats counts CHARACTERS added / removed, which is what the reader is
// judging ("a word changed" vs "half the note was rewritten"). Token counts
// would be less legible for CJK, where one token is often one character.
export const diffTextStats = (
  segments: TextDiffSegment[]
): { added: number; removed: number } => {
  let added = 0
  let removed = 0
  for (const s of segments) {
    if (s.op === 'insert') added += s.text.length
    else if (s.op === 'delete') removed += s.text.length
  }
  return { added, removed }
}

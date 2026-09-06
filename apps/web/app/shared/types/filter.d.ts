// The filter bar shared by /galgame, /gallib and the search page's lanes.

interface FilterOption {
  value: string
  label: string
  /** Drawn right-aligned and dimmer: a count, a short example, a caveat. */
  hint?: string
}

// One entry of the bar's summary row. `key` is what @remove hands back, so it
// has to name the value and not only the dimension it came from.
interface FilterChip {
  key: string
  label: string
  /** The dimension, drawn dimmer in front of the value. */
  prefix?: string
}

// The 会社 / 标签 lanes key on catalog ids, so their option value is a number
// and the cap is expressed by disabling the rows that would exceed it.
interface FilterEntityOption {
  value: number
  label: string
  hint?: string
  disabled?: boolean
}

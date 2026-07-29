// Types for the Galgame release calendar (发售月表). Backed by the CATALOG
// calendar bucket since wave A2-2, surfaced via moyu's /galgame/calendar
// endpoint. Ambient (no import/export) to match the rest of app/shared/types.
// The sibling /calendar/{pending,tba} buckets were retired in wave A1 — nothing
// on the frontend ever rendered them.
//
// POPULATION: the month now covers the WHOLE catalog, not just the games the
// wiki has an entry for (refs/proj/126 P1). That is why a card can arrive with
// no gid and no claim — see CalendarItem.claim_state.

// release_precision marks how release_date should be read (release_date is
// normalized, so the two MUST be read together).
type GalgameReleasePrecision = 'day' | 'month' | 'year' | 'tba' | 'unknown'

// A calendar entry is an enriched GalgameCard plus has_patch: whether moyu holds
// a local patch row for this galgame (drives the card's link — moyu /patch/:id
// when true, the wiki entry page otherwise). release_date / release_precision live
// on the nested `galgame` object.
interface CalendarItem extends GalgameCard {
  has_patch: boolean
  // Whether the logged-in viewer has favorited this game (false for anonymous).
  // Drives the inline 收藏 toggle's initial state on the calendar card.
  is_favorite: boolean
  // Which of THREE cards to render (replaced the wiki `status` int in A2-2):
  //   'live'  — a published wiki entry; links to /patch/:id
  //   'draft' — unpublished; shows a 未发布 badge and routes to the publish
  //             wizard to 认领 (the old status === 2)
  //   ''      — NO wiki entry at all; shows 未上论坛 and has no gid to link to
  // 'hidden' (withdrawn) never arrives — the backend drops those.
  claim_state: string
}

// GET /galgame/calendar?month=YYYY-MM
interface CalendarMonthResponse {
  month: string
  today: string
  items: CalendarItem[]
  meta: {
    prev_month: string
    next_month: string
    has_prev: boolean
    has_next: boolean
    min_month: string
    max_month: string
    count: number
  }
}

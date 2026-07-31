package client

// NextMoe /v1/catalog public-contract wire DTOs (wave A2-2, the canonical-API
// re-anchor).
//
// Background: moyu's galgame READ set used to consume /v1/galgame — the kungal
// PRODUCT face, deprecated with Sunset 2026-10-31. This wave moves the whole
// read set onto /v1/catalog, the cross-media identity registry that is the
// canonical data API. This file holds the catalog wire structs the client
// parses; catalog_map.go projects them back onto the moyu-internal DTOs
// (GalgameBrief / GalgameHit / GalgameFull) so moyu's OWN API output stays
// stable for everything the two faces both carry.
//
// The one shape that could NOT be preserved is the wiki status machine
// (published / banned / draft / pending / declined). The catalog is a registry,
// not a product, and refuses by design to mirror another service's states — see
// refs/proj/106 R2. What it exposes instead is claim VISIBILITY, a
// catalog-owned three-state vocabulary (claimedBy.State below), which is what
// every consumer actually needed the status for.

// ─── claim pointer ────────────────────────────────────────────────────────

// Claim visibility states (catalogClaimState*): the catalog's own vocabulary
// for "what may a consumer render for this claim", NOT a copy of the wiki's
// status column.
//
//   - live   — publicly visible on the product face. The ONLY state the
//     deprecated face's published-only reads ever returned, so the batch and
//     detail lanes gate on exactly this and inherit their old semantics.
//   - draft  — a wiki row exists but is unpublished (VNDB draft / pending
//     submission). The deprecated reads returned nothing for these; the
//     calendar is the one lane that deliberately surfaces them (as claimable
//     cards), exactly as it did before.
//   - hidden — the wiki withdrew it (banned / declined). Never renderable.
//     This is the load-bearing one: the deprecated face's published-only
//     filter was ALSO moyu's ban gate, so a re-anchor that ignored this would
//     silently republish banned entries.
const (
	catalogClaimStateLive   = "live"
	catalogClaimStateDraft  = "draft"
	catalogClaimStateHidden = "hidden"
)

// catalogClaimSiteKungal is the claim pointer's `site` value for the product
// face that owns the gid key space — the ONE site whose claimed_by.work_id is
// a wiki gid (what this client's callers mean by "galgame id"). moyu is NOT
// that site: it borrows the same key space (patch.id IS the gid), it does not
// mint it.
//
// The value is `kungal` because the W1 window's re-site step rewrites
// catalog_work.site from `galgame_wiki` to `kungal`. It is NOT the external_ref
// source key (see anchorSourceKeys in catalog_resolve.go), even though the two
// spelled `galgame_wiki` alike for as long as the wiki was both the claiming
// product and the provenance of the bridged rows. They stop agreeing in the
// window, in two DIFFERENT deploy steps, which is why one constant cannot
// describe both.
const catalogClaimSiteKungal = "kungal"

// catalogClaimSiteLegacy is what `claimed_by.site` reads until the re-site step
// rewrites it. Accepting both spellings is what keeps this reader correct on
// either side of that step, in either deploy order, so the flip needs no
// coordinated moyu deploy: a constant matching only the new value would return
// gid 0 for every row until the data caught up, and gid 0 raises nothing — it
// silently strips every card's link and mis-attaches every entry's local stats.
//
// Only READ. moyu writes no claim site at all, so nothing here can mint a row
// in the old vocabulary. Removable once the re-site has soaked; the tests in
// catalog_rename_test.go are what should fail first when it goes.
const catalogClaimSiteLegacy = "galgame_wiki"

// isGIDClaimSite reports whether a claim's site is the one whose work_id is a
// gid, under either spelling.
func isGIDClaimSite(site string) bool {
	return site == catalogClaimSiteKungal || site == catalogClaimSiteLegacy
}

// catalogClaimedBy is the cross-face content pointer. Null when the catalog row
// is unclaimed — i.e. the work exists in the registry but no product face holds
// an entry for it ("not on the forum yet").
// ContentLimit is the claiming entry's EDITING axis (sfw | nsfw) — the wiki
// column itself, not a projection of the registry's age rating. It is the
// authority for both the display value and the content_limit= filter, and it
// exists only where a claim does; an unclaimed work has no edited body and
// therefore no such verdict (see contentAxisOf's fallback).
type catalogClaimedBy struct {
	Site         string `json:"site"`
	WorkID       int64  `json:"work_id"`
	State        string `json:"state"`
	ContentLimit string `json:"content_limit"`
}

// gid returns the wiki galgame id this claim points at, or 0 when the claim is
// absent or belongs to some other product face.
func (c *catalogClaimedBy) gid() int {
	if c == nil || !isGIDClaimSite(c.Site) {
		return 0
	}
	return int(c.WorkID)
}

// renderable reports whether a consumer may render this work's product content.
// A missing claim is renderable — it just has no product body (the "not on the
// forum" card); a hidden claim is not, at all.
func (c *catalogClaimedBy) renderable() bool {
	return c == nil || c.State != catalogClaimStateHidden
}

// live reports whether the claim is a published wiki entry — the exact
// population the deprecated face's batch / detail / search reads served.
func (c *catalogClaimedBy) live() bool {
	return c != nil && isGIDClaimSite(c.Site) && c.State == catalogClaimStateLive
}

// ─── shared blocks ────────────────────────────────────────────────────────

// catalogRef is one EXACT external identity anchor. On works these are the vndb
// / dlsite / bangumi ids; vndb work ids are stored (and emitted) WITH the
// leading `v`, which is byte-identical to moyu's own patch.vndb_id form.
type catalogRef struct {
	Source     string `json:"source"`
	ExternalID string `json:"external_id"`
}

// catalogNames is the D7 product-key title pivot (include=names). Keys absent
// when the work carries no title in that language.
type catalogNames struct {
	JaJP string `json:"ja-jp"`
	ZhCN string `json:"zh-cn"`
	ZhTW string `json:"zh-tw"`
	EnUS string `json:"en-us"`
}

// catalogIntroSlot is one product key's intro with its provenance. Machine
// marks an LLM translation, which the catalog only ever serves for a language
// that has no source text at all.
type catalogIntroSlot struct {
	Intro   string `json:"intro"`
	Source  string `json:"source"`
	Machine bool   `json:"machine"`
}

// catalogIntros is the D7 product-key intro pivot (include=intros).
type catalogIntros struct {
	JaJP *catalogIntroSlot `json:"ja-jp"`
	ZhCN *catalogIntroSlot `json:"zh-cn"`
	ZhTW *catalogIntroSlot `json:"zh-tw"`
	EnUS *catalogIntroSlot `json:"en-us"`
}

// catalogCoverSlot is one filled cover slot on the list face: a complete CDN
// URL plus the intrinsic display metadata (absent when image_service has no
// entry for the hash).
type catalogCoverSlot struct {
	URL       string `json:"url"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
	Thumbhash string `json:"thumbhash"`
	Sexual    int    `json:"sexual"`
	Violence  int    `json:"violence"`
	Source    string `json:"source"`
}

// catalogCoverSlots is the two-slot cover projection (include=covers). Either
// may be null; both may point at the same image when only one cover is usable.
// moyu's "effective banner" is the pinned KEY ART, so it maps from portrait —
// not from banner, which is the wide hero art the catalog added alongside it.
type catalogCoverSlots struct {
	Portrait *catalogCoverSlot `json:"portrait"`
	Banner   *catalogCoverSlot `json:"banner"`
}

// ─── works list / search item ─────────────────────────────────────────────

// catalogWorkListItem is one row of GET /v1/catalog/works, of the calendar
// buckets and of GET /v1/catalog/works/search — the three lanes share this row
// VERBATIM, which is why one mapper serves all of them.
type catalogWorkListItem struct {
	ID            int64             `json:"id"`
	Medium        string            `json:"medium"`
	DisplayName   string            `json:"display_name"`
	ContentRating string            `json:"content_rating"`
	OLang         string            `json:"olang"`
	ReleaseDate   *string           `json:"release_date"`
	ClaimedBy     *catalogClaimedBy `json:"claimed_by"`
	Cover         string            `json:"cover"`
	Updated       string            `json:"updated"`

	Names  *catalogNames      `json:"names"`
	Intros *catalogIntros     `json:"intros"`
	Covers *catalogCoverSlots `json:"covers"`
	Refs   []catalogRef       `json:"refs"`
}

// catalogWorksListData is the keyset works-list envelope.
type catalogWorksListData struct {
	Items      []catalogWorkListItem `json:"items"`
	NextCursor *string               `json:"next_cursor"`
}

// catalogWorksSearchData is the works product-search envelope. total is the
// size of the whole filtered set under the SAME gate that produced items — the
// deprecated face's search deliberately did not hold that property (its total
// ignored the sfw filter its items applied), so paging is now lossless.
type catalogWorksSearchData struct {
	Total int64                 `json:"total"`
	Page  int                   `json:"page"`
	Limit int                   `json:"limit"`
	Items []catalogWorkListItem `json:"items"`
}

// ─── calendar ─────────────────────────────────────────────────────────────

// catalogCalendarMeta is the calendar's navigation frame. min/max_month are
// computed under the CALLER'S own population gates, so "the newest month with
// anything in it" means the newest month THIS caller can see something in.
type catalogCalendarMeta struct {
	Today    string `json:"today"`
	MinMonth string `json:"min_month"`
	MaxMonth string `json:"max_month"`
	HasPrev  *bool  `json:"has_prev"`
	HasNext  *bool  `json:"has_next"`
}

// catalogCalendarData is the envelope of all three calendar buckets.
type catalogCalendarData struct {
	Month      string                `json:"month"`
	Year       string                `json:"year"`
	Count      int64                 `json:"count"`
	Items      []catalogWorkListItem `json:"items"`
	NextCursor *string               `json:"next_cursor"`
	Meta       catalogCalendarMeta   `json:"meta"`
}

// ─── work detail ──────────────────────────────────────────────────────────

// catalogTitle is one display title on the detail face (the complete language
// set, unlike include=names' four-key rendering convenience).
type catalogTitle struct {
	Lang  string `json:"lang"`
	Title string `json:"title"`
	Kind  string `json:"kind"`
}

// catalogWorkIntro is one language's intro on the detail face.
type catalogWorkIntro struct {
	Lang    string `json:"lang"`
	Intro   string `json:"intro"`
	Source  string `json:"source"`
	Machine bool   `json:"machine"`
}

// catalogDetailCover is one cover row on the detail face — the FULL set, each
// row carrying its own content flags, unlike the list face's two curated slots.
type catalogDetailCover struct {
	URL            string `json:"url"`
	Kind           string `json:"kind"`
	PortraitPinned bool   `json:"portrait_pinned"`
	Sexual         int    `json:"sexual"`
	Violence       int    `json:"violence"`
	Source         string `json:"source"`
	Width          int    `json:"width"`
	Height         int    `json:"height"`
	Thumbhash      string `json:"thumbhash"`
}

// catalogScreenshot is one screenshot row on the detail face.
type catalogScreenshot struct {
	URL       string `json:"url"`
	Caption   string `json:"caption"`
	Sexual    int    `json:"sexual"`
	Violence  int    `json:"violence"`
	Source    string `json:"source"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
	Thumbhash string `json:"thumbhash"`
}

// catalogWorkTag is one content tag, plus the SAFETY AXIS (A2-1e / R8).
//
// Spoiler is the work-tag EDGE's level (0 none / 1 minor / 2 major) and Sexual
// flags the tag itself as sexual-category. Both carry the coverage caveat the
// catalog states plainly: the axis exists upstream only for the VNDB-derived
// vocabulary, so Bangumi / DLsite folksonomy rows read 0/false, which means
// "this source has no such axis", NOT "confirmed safe".
//
// CanonicalID is present only for tags mapped into the canonical vocabulary; an
// unmapped tag has no addressable id and therefore no tag page to link to.
type catalogWorkTag struct {
	Name        string `json:"name"`
	Count       int    `json:"count"`
	Source      string `json:"source"`
	CanonicalID int64  `json:"canonical_id"`
	Tier        string `json:"tier"`
	Kind        string `json:"kind"`
	Spoiler     int    `json:"spoiler"`
	Sexual      bool   `json:"sexual"`
}

// catalogWorkLabel is one attribution edge to a label (the catalog's word for
// what the wiki called an "official": brand / publisher / circle / developer).
type catalogWorkLabel struct {
	ID          int64  `json:"id"`
	DisplayName string `json:"display_name"`
	LabelKind   string `json:"label_kind"`
	Kind        string `json:"kind"`
	Lang        string `json:"lang"`
}

// catalogWorkEngine is one engine attribution on a work.
type catalogWorkEngine struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

// catalogWorkLink is one NON-IDENTITY external web link. Two absences are
// contract rather than oversight (doc 126 D6): no user attribution — the wiki's
// user-submitted rows were absorbed as platform-curated URL bytes — and no
// caption, because the user-typed label was not carried across and inventing
// one would be fabrication.
type catalogWorkLink struct {
	Source string `json:"source"`
	URL    string `json:"url"`
}

// catalogWork is the work detail record (GET /v1/catalog/works/{id}). Every
// facet block below is ALWAYS present ([] when empty); only relations/credits
// are include-gated, and moyu asks for neither.
type catalogWork struct {
	ID            int64             `json:"id"`
	Medium        string            `json:"medium"`
	DisplayName   string            `json:"display_name"`
	OLang         string            `json:"olang"`
	ContentRating string            `json:"content_rating"`
	ReleaseDate   *string           `json:"release_date"`
	Created       string            `json:"created"`
	Updated       string            `json:"updated"`
	Titles        []catalogTitle    `json:"titles"`
	Refs          []catalogRef      `json:"refs"`
	ClaimedBy     *catalogClaimedBy `json:"claimed_by"`

	Intro       []catalogWorkIntro   `json:"intro"`
	Covers      []catalogDetailCover `json:"covers"`
	Screenshots []catalogScreenshot  `json:"screenshots"`
	Tags        []catalogWorkTag     `json:"tags"`
	Labels      []catalogWorkLabel   `json:"labels"`
	Engines     []catalogWorkEngine  `json:"engines"`
	Links       []catalogWorkLink    `json:"links"`
}

// ─── reverse lookup ───────────────────────────────────────────────────────

// catalogLookupPair is one (source, external_id) request in a batch lookup.
type catalogLookupPair struct {
	Source     string `json:"source"`
	ExternalID string `json:"external_id"`
}

// catalogLookupBatchRequest is the batch reverse-lookup body (<=100 pairs).
type catalogLookupBatchRequest struct {
	Items []catalogLookupPair `json:"items"`
}

// catalogLookupBatchItem echoes the request pair and carries its resolution;
// every block is null for a miss.
type catalogLookupBatchItem struct {
	Source     string            `json:"source"`
	ExternalID string            `json:"external_id"`
	Work       *catalogWorkBrief `json:"work"`
	ClaimedBy  *catalogClaimedBy `json:"claimed_by"`
}

// catalogWorkBrief is the lightweight work identity a lookup resolves to.
type catalogWorkBrief struct {
	ID            int64  `json:"id"`
	Medium        string `json:"medium"`
	DisplayName   string `json:"display_name"`
	ContentRating string `json:"content_rating"`
}

// catalogLookupBatchData is the batch reverse-lookup envelope.
type catalogLookupBatchData struct {
	Items []catalogLookupBatchItem `json:"items"`
}

// catalogLookupData is the single reverse-lookup result.
type catalogLookupData struct {
	Work      *catalogWorkBrief `json:"work"`
	ClaimedBy *catalogClaimedBy `json:"claimed_by"`
}

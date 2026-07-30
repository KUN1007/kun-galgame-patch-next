package client

// Mappers: /v1/catalog wire -> the moyu-internal DTOs (wave A2-2).
//
// The moyu DTOs (GalgameBrief / GalgameHit / GalgameFull) are the shapes the
// enricher and, through it, moyu's own public API already emit. Keeping them
// and re-sourcing their values is what lets a face migration of this size land
// without rewriting every handler: moyu's output stays stable for every field
// the two upstream faces both carry.
//
// Where they do NOT both carry it, the projection is written out here rather
// than hidden, because each one is a real product decision:
//
//	release_date  the catalog dates are PARTIAL ISO (YYYY / YYYY-MM /
//	              YYYY-MM-DD, precision self-evident from the length). moyu's
//	              contract is a normalized full date PLUS a precision field, so
//	              the adapter re-normalizes and re-derives the precision. The
//	              placeholder day/month it writes back are exactly the ones the
//	              deprecated face wrote, and release_precision stays the
//	              authority on how to read them.
//	content axis  moyu carries two (content_limit sfw|nsfw = the EDITING axis,
//	              age_limit all|r18 = the AGE axis). age_limit comes off the
//	              catalog's content_rating; content_limit comes off
//	              claimed_by.content_limit, the wiki column itself, and only
//	              falls back to the rating when nothing claims the work. See
//	              contentAxisOf.
//	olang         the catalog stores upstream BCP-47 (ja / zh-Hans / en); moyu
//	              renders product locales (ja-jp / zh-cn / en-us). Unknown tags
//	              pass through verbatim rather than being dropped.
//	claim state   replaces the wiki `status` int outright — see catalog_dto.go.

import (
	"strconv"
	"strings"
)

// hashFromURL extracts the content-addressed image hash from a sharded CDN URL
// ({base}/aa/bb/<hash>.webp): the basename minus the extension. moyu's
// CoverInput / GalgameBrief store the bare hash and resolve the URL themselves,
// so every image the catalog renders as a complete URL is unwound here. Returns
// "" for an empty URL (no image).
func hashFromURL(u string) string {
	if u == "" {
		return ""
	}
	base := u
	if i := strings.LastIndexByte(base, '/'); i >= 0 {
		base = base[i+1:]
	}
	if i := strings.LastIndexByte(base, '.'); i >= 0 {
		base = base[:i]
	}
	return base
}

// ─── language ─────────────────────────────────────────────────────────────

// productLangFromCatalog maps a catalog BCP-47 language tag to moyu's product
// locale key (the D7 table). Unrecognized tags pass through unchanged so a new
// upstream language shows up as itself instead of vanishing.
func productLangFromCatalog(lang string) string {
	l := strings.ToLower(strings.TrimSpace(lang))
	switch {
	case l == "":
		return ""
	case l == "ja" || strings.HasPrefix(l, "ja-"):
		return "ja-jp"
	case l == "zh-hant" || strings.HasPrefix(l, "zh-hant-") || l == "zh-tw" || l == "zh-hk":
		return "zh-tw"
	case l == "zh" || l == "zh-hans" || strings.HasPrefix(l, "zh"):
		return "zh-cn"
	case l == "en" || strings.HasPrefix(l, "en-"):
		return "en-us"
	}
	return lang
}

// catalogLangFromProduct is productLangFromCatalog's inverse, used to translate
// moyu's `original_language` filter into the catalog's `olang` vocabulary.
// zh-cn maps to the bare `zh` family prefix because the catalog's own olang
// gate treats every `zh*` tag as one family.
func catalogLangFromProduct(lang string) string {
	switch strings.ToLower(strings.TrimSpace(lang)) {
	case "ja-jp":
		return "ja"
	case "zh-cn":
		return "zh-Hans"
	case "zh-tw":
		return "zh-Hant"
	case "en-us":
		return "en"
	}
	return lang
}

// ─── content rating ───────────────────────────────────────────────────────

// contentAxisOf resolves the (content_limit, age_limit) pair moyu's DTOs carry
// from the catalog's two independent sources.
//
// age_limit is the AGE axis and comes straight off content_rating, unchanged:
// r18 → r18, everything else → all.
//
// content_limit is the EDITING axis and its authority is the CLAIM — the wiki
// entry's own column, served as claimed_by.content_limit. Deriving it from the
// age rating instead is the doc 106 §38 incident: on prod 94.5% of the claimed
// live population is rated r18 while barely 44% is edited nsfw, so the derived
// value mislabelled thousands of entries.
//
// The rating is still the FALLBACK, and only where there is nothing better: a
// work no wiki entry claims has no edited body to have a verdict about, so the
// conservative registry reading stands in (r18 → nsfw, all_ages / sensitive →
// sfw — `sensitive` is where the wiki's own sfw grading put that material).
func contentAxisOf(claim *catalogClaimedBy, rating string) (contentLimit, ageLimit string) {
	ageLimit = "all"
	if rating == "r18" {
		ageLimit = "r18"
	}
	if claim != nil && claim.Site == catalogSiteGalgameWiki {
		switch claim.ContentLimit {
		case "sfw", "nsfw":
			return claim.ContentLimit, ageLimit
		}
	}
	if rating == "r18" {
		return "nsfw", ageLimit
	}
	return "sfw", ageLimit
}

// ─── dates ────────────────────────────────────────────────────────────────

// normalizeCatalogDate turns a catalog partial-ISO date into the (normalized
// full date, precision) pair moyu's DTOs carry.
//
// The placeholder components this writes are NOT data — "2021" becomes
// 2021-01-01 with precision "year", and a consumer that reads the date without
// the precision will believe a January 1st that was never asserted. That is the
// deprecated face's own convention, preserved deliberately so moyu's frontend
// (which already reads the pair together) needs no change.
func normalizeCatalogDate(date *string) (*string, string) {
	if date == nil {
		return nil, ""
	}
	d := strings.TrimSpace(*date)
	switch len(d) {
	case 10: // YYYY-MM-DD
		return &d, "day"
	case 7: // YYYY-MM
		full := d + "-01"
		return &full, "month"
	case 4: // YYYY
		full := d + "-01-01"
		return &full, "year"
	}
	return nil, ""
}

// ─── list item -> brief / hit ─────────────────────────────────────────────

// namesOf reads the four product keys off an include=names block.
func namesOf(n *catalogNames) (ja, zhCN, zhTW, en string) {
	if n == nil {
		return "", "", "", ""
	}
	return n.JaJP, n.ZhCN, n.ZhTW, n.EnUS
}

// vndbIDOf finds the work's vndb anchor in an include=refs block. The registry
// stores vndb work ids WITH the leading `v`, which is byte-identical to moyu's
// own patch.vndb_id form — so this needs no reformatting and the local patch
// join by vndb_id keeps working unchanged.
func vndbIDOf(refs []catalogRef) string {
	for _, r := range refs {
		if r.Source == "vndb" {
			return r.ExternalID
		}
	}
	return ""
}

// coverOf picks the slot that fills moyu's "effective banner" — the field every
// card and the detail hero render.
//
// It is the LANDSCAPE one. The name is not decoration: the wiki's own
// EffectiveBanner was the lowest-sort_order cover, which on this archive is the
// wide key art, and moyu's card layout has been built around that picture for
// its whole life. The A2-2 re-anchor read the catalog's `portrait` slot instead
// and visibly changed every cover on the site (doc 106 §38, user-reported); the
// order was to keep the horizontal banner, so this reads `banner` first and
// falls back to `portrait` for the works that have no landscape cover at all.
//
// Last resort is the list row's single `cover` URL, for a caller that did not
// ask for include=covers.
func coverOf(it *catalogWorkListItem) (hash string, width, height int, thumbhash string) {
	if it.Covers != nil {
		if c := it.Covers.Banner; c != nil {
			return hashFromURL(c.URL), c.Width, c.Height, c.Thumbhash
		}
		if c := it.Covers.Portrait; c != nil {
			return hashFromURL(c.URL), c.Width, c.Height, c.Thumbhash
		}
	}
	return hashFromURL(it.Cover), 0, 0, ""
}

// claimStateOf reads the claim's visibility, or "" when the work has no product
// claim at all (the "not on the forum" case, which the full-catalog population
// lanes render as their own card).
func claimStateOf(c *catalogClaimedBy) string {
	if c == nil || c.Site != catalogSiteGalgameWiki {
		return ""
	}
	return c.State
}

// catalogItemToBrief projects a catalog works-list row onto the internal
// GalgameBrief. The row's identity is its CLAIM: moyu is gid-keyed, so an item
// whose claim does not point at the wiki has no id moyu can use and the caller
// is expected to have filtered it out already (or to be a full-population lane
// that renders it claim-less).
func catalogItemToBrief(it *catalogWorkListItem) GalgameBrief {
	ja, zhCN, zhTW, en := namesOf(it.Names)
	cl, age := contentAxisOf(it.ClaimedBy, it.ContentRating)
	date, precision := normalizeCatalogDate(it.ReleaseDate)
	hash, w, h, th := coverOf(it)

	b := GalgameBrief{
		ID:                       it.ClaimedBy.gid(),
		CatalogWorkID:            it.ID,
		VndbID:                   vndbIDOf(it.Refs),
		ClaimState:               claimStateOf(it.ClaimedBy),
		NameJaJp:                 ja,
		NameZhCn:                 zhCN,
		NameZhTw:                 zhTW,
		NameEnUs:                 en,
		ContentLimit:             cl,
		AgeLimit:                 age,
		OriginalLanguage:         productLangFromCatalog(it.OLang),
		ReleaseDate:              date,
		ReleasePrecision:         precision,
		EffectiveBannerHash:      hash,
		EffectiveBannerWidth:     w,
		EffectiveBannerHeight:    h,
		EffectiveBannerThumbhash: th,
	}
	// A work with no wiki entry still needs a display name for the "not on the
	// forum" card; the catalog's display_name is its best single title.
	if ja == "" && zhCN == "" && zhTW == "" && en == "" {
		b.NameJaJp = it.DisplayName
	}
	return b
}

// catalogItemToHit projects a catalog works-list row onto the internal
// GalgameHit (the search item shape). GalgameHit is a superset of GalgameBrief;
// the id-array fields have no catalog counterpart on the list row and stay nil,
// exactly as they did on the deprecated face's thin search item.
func catalogItemToHit(it *catalogWorkListItem) GalgameHit {
	b := catalogItemToBrief(it)
	return GalgameHit{
		ID:                       b.ID,
		CatalogWorkID:            b.CatalogWorkID,
		VndbID:                   b.VndbID,
		ClaimState:               b.ClaimState,
		NameEnUs:                 b.NameEnUs,
		NameZhCn:                 b.NameZhCn,
		NameJaJp:                 b.NameJaJp,
		NameZhTw:                 b.NameZhTw,
		ContentLimit:             b.ContentLimit,
		AgeLimit:                 b.AgeLimit,
		OriginalLanguage:         b.OriginalLanguage,
		ReleaseDate:              b.ReleaseDate,
		EffectiveBannerHash:      b.EffectiveBannerHash,
		EffectiveBannerWidth:     b.EffectiveBannerWidth,
		EffectiveBannerHeight:    b.EffectiveBannerHeight,
		EffectiveBannerThumbhash: b.EffectiveBannerThumbhash,
	}
}

// ─── detail -> GalgameFull ────────────────────────────────────────────────

// introByProductKey collapses the detail face's complete intro list onto moyu's
// four product keys, keeping the first row that lands on each key (the catalog
// has already merged each language to its winning source).
func introByProductKey(rows []catalogWorkIntro) map[string]string {
	out := make(map[string]string, 4)
	for _, r := range rows {
		k := productLangFromCatalog(r.Lang)
		switch k {
		case "ja-jp", "zh-cn", "zh-tw", "en-us":
			if _, taken := out[k]; !taken {
				out[k] = r.Intro
			}
		}
	}
	return out
}

// titleByProductKey does the same for the detail face's complete title list,
// preferring the official kind (the list arrives ordered by kind already).
func titleByProductKey(rows []catalogTitle) map[string]string {
	out := make(map[string]string, 4)
	for _, r := range rows {
		k := productLangFromCatalog(r.Lang)
		switch k {
		case "ja-jp", "zh-cn", "zh-tw", "en-us":
			if _, taken := out[k]; !taken {
				out[k] = r.Title
			}
		}
	}
	return out
}

// catalogCoversToInputs maps the detail face's cover rows onto moyu's
// CoverInput slice. sort_order is synthesized from the (server-ordered) index,
// as it was on the deprecated face; source/source_key now carry real values,
// which the deprecated face's curation used to drop.
func catalogCoversToInputs(covers []catalogDetailCover) []CoverInput {
	if len(covers) == 0 {
		return nil
	}
	out := make([]CoverInput, 0, len(covers))
	for i := range covers {
		c := &covers[i]
		out = append(out, CoverInput{
			ImageHash: hashFromURL(c.URL),
			SortOrder: i,
			Sexual:    c.Sexual,
			Violence:  c.Violence,
			Source:    c.Source,
			Kind:      c.Kind,
			Width:     c.Width,
			Height:    c.Height,
			Thumbhash: c.Thumbhash,
		})
	}
	return out
}

// catalogScreenshotsToInputs is catalogCoversToInputs for screenshots.
func catalogScreenshotsToInputs(shots []catalogScreenshot) []ScreenshotInput {
	if len(shots) == 0 {
		return nil
	}
	out := make([]ScreenshotInput, 0, len(shots))
	for i := range shots {
		s := &shots[i]
		out = append(out, ScreenshotInput{
			ImageHash: hashFromURL(s.URL),
			SortOrder: i,
			Caption:   s.Caption,
			Sexual:    s.Sexual,
			Violence:  s.Violence,
			Source:    s.Source,
			Width:     s.Width,
			Height:    s.Height,
			Thumbhash: s.Thumbhash,
		})
	}
	return out
}

// heroCover returns the cover row moyu treats as the effective banner, the
// detail-page twin of coverOf: the first LANDSCAPE row, else the portrait-pinned
// one, else the first.
//
// The detail face serves the full cover list rather than the two curated slots,
// so the orientation is decided here from the rows' own dimensions — using the
// registry's own cutoff (see isLandscape) so a work cannot get a landscape card
// and a portrait hero. Rows with no known dimensions are not landscape
// candidates: image_service has no entry for them, so their shape is unknown
// rather than wide.
func heroCover(covers []catalogDetailCover) *catalogDetailCover {
	if len(covers) == 0 {
		return nil
	}
	for i := range covers {
		if isLandscape(covers[i].Width, covers[i].Height) {
			return &covers[i]
		}
	}
	for i := range covers {
		if covers[i].PortraitPinned {
			return &covers[i]
		}
	}
	return &covers[0]
}

// isLandscape is the catalog's own portrait cutoff, inverted: a cover counts as
// portrait when height exceeds width * 1.05, so everything else with real
// dimensions is landscape. Kept as the exact rational 21/20 (no floats), the
// same way the registry's cover-slot picker spells it.
func isLandscape(w, h int) bool {
	return w > 0 && h > 0 && int64(h)*20 <= int64(w)*21
}

// catalogWorkToFull projects the catalog work detail record onto the internal
// GalgameFull the detail enricher consumes.
func catalogWorkToFull(w *catalogWork) GalgameFull {
	cl, age := contentAxisOf(w.ClaimedBy, w.ContentRating)
	date, _ := normalizeCatalogDate(w.ReleaseDate)
	titles := titleByProductKey(w.Titles)
	intros := introByProductKey(w.Intro)

	f := GalgameFull{
		ID:               w.ClaimedBy.gid(),
		CatalogWorkID:    w.ID,
		VndbID:           vndbIDOf(w.Refs),
		ClaimState:       claimStateOf(w.ClaimedBy),
		NameJaJp:         titles["ja-jp"],
		NameZhCn:         titles["zh-cn"],
		NameZhTw:         titles["zh-tw"],
		NameEnUs:         titles["en-us"],
		IntroJaJp:        intros["ja-jp"],
		IntroZhCn:        intros["zh-cn"],
		IntroZhTw:        intros["zh-tw"],
		IntroEnUs:        intros["en-us"],
		ContentLimit:     cl,
		AgeLimit:         age,
		OriginalLanguage: productLangFromCatalog(w.OLang),
		ReleaseDate:      date,
		Created:          w.Created,
		Updated:          w.Updated,
		Covers:           catalogCoversToInputs(w.Covers),
		Screenshots:      catalogScreenshotsToInputs(w.Screenshots),
	}
	if f.NameJaJp == "" && f.NameZhCn == "" && f.NameZhTw == "" && f.NameEnUs == "" {
		f.NameJaJp = w.DisplayName
	}
	if c := heroCover(w.Covers); c != nil {
		f.EffectiveBannerHash = hashFromURL(c.URL)
		f.EffectiveBannerWidth = c.Width
		f.EffectiveBannerHeight = c.Height
		f.EffectiveBannerThumbhash = c.Thumbhash
	}
	for i := range w.Tags {
		f.Tag = append(f.Tag, catalogTagToFullTag(f.ID, &w.Tags[i]))
	}
	for i := range w.Labels {
		f.Official = append(f.Official, catalogLabelToFullOfficial(f.ID, &w.Labels[i]))
	}
	// w.Engines and w.Links are deliberately not mapped: GalgameFull carries
	// neither any more (nothing rendered the bare engine ids or the link rows —
	// see its doc comment). They stay in the wire struct so the omission is a
	// visible decision rather than a parse that silently never happened.
	return f
}

// catalogTagToFullTag builds one GalgameFull.Tag entry.
//
// The `category` the wiki carried (content | sexual | technical) does not exist
// in the canonical vocabulary — `tier` and `kind` are a different axis
// entirely. What DOES survive is the part that was load-bearing: the per-edge
// spoiler level and the per-tag sexual flag, which the catalog serves as first
// class fields (A2-1e / R8). So `category` is now DERIVED from the sexual flag
// rather than passed through: a sexual-flagged tag reads "sexual", everything
// else reads "content". moyu's safe-mode gate keys on exactly that value, so it
// keeps working — and it is now driven by a dedicated boolean instead of a
// free-text vocabulary that happened to contain the right word.
//
// `technical` has no successor and is not synthesized: nothing but the wiki
// ever asserted it, and inventing a third value from tier/kind would be a
// guess dressed as data.
func catalogTagToFullTag(gid int, t *catalogWorkTag) GalgameFullTag {
	category := tagCategoryFor(t.Sexual)
	return GalgameFullTag{
		GalgameID:    gid,
		TagID:        int(t.CanonicalID),
		SpoilerLevel: t.Spoiler,
		Tag: Tag{
			ID:       int(t.CanonicalID),
			Name:     t.Name,
			Category: category,
		},
	}
}

// tagCategoryFor projects the catalog's tag-level `sexual` boolean onto the
// category string every moyu consumer keys on. Shared by the work detail's
// tags[] and the tag page, so the two can never disagree about what makes a tag
// sexual — which matters, because that word drives an SFW hard-hide and an SEO
// gate.
func tagCategoryFor(sexual bool) string {
	if sexual {
		return "sexual"
	}
	return "content"
}

// catalogLabelToFullOfficial builds one GalgameFull.Official entry. The
// catalog's label_kind vocabulary (game_brand | bunko | publisher |
// anime_studio | doujin_circle | group) replaces the wiki's own category
// strings verbatim — a visible wording change on the detail page, and the
// canonical vocabulary going forward.
func catalogLabelToFullOfficial(gid int, l *catalogWorkLabel) GalgameFullOfficial {
	return GalgameFullOfficial{
		GalgameID:  gid,
		OfficialID: int(l.ID),
		Official: Official{
			ID:       int(l.ID),
			Name:     l.DisplayName,
			Category: l.LabelKind,
			Lang:     productLangFromCatalog(l.Lang),
		},
	}
}

// ─── query helpers ────────────────────────────────────────────────────────

// joinCatalogLangs renders a moyu `original_language` csv as the catalog's
// `olang` csv.
func joinCatalogLangs(csv string) string {
	if strings.TrimSpace(csv) == "" {
		return ""
	}
	parts := strings.Split(csv, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, catalogLangFromProduct(p))
		}
	}
	return strings.Join(out, ",")
}

// yearLowerBound / yearUpperBound render moyu's year-granular release filter as
// the catalog's YYYY-MM-DD bounds.
func yearLowerBound(y int) string { return strconv.Itoa(y) + "-01-01" }
func yearUpperBound(y int) string { return strconv.Itoa(y) + "-12-31" }

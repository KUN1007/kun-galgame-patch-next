package client

import (
	"strconv"
	"strings"
)

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

func contentAxisOf(claim *catalogClaimedBy, rating string) (contentLimit, ageLimit string) {
	ageLimit = "all"
	if rating == "r18" {
		ageLimit = "r18"
	}
	if claim != nil && isGIDClaimSite(claim.Site) {
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

func normalizeCatalogDate(date *string) (*string, string) {
	if date == nil {
		return nil, ""
	}
	d := strings.TrimSpace(*date)
	switch len(d) {
	case 10:
		return &d, "day"
	case 7:
		full := d + "-01"
		return &full, "month"
	case 4:
		full := d + "-01-01"
		return &full, "year"
	}
	return nil, ""
}

func namesOf(n *catalogNames) (ja, zhCN, zhTW, en string) {
	if n == nil {
		return "", "", "", ""
	}
	return n.JaJP.Value, n.ZhCN.Value, n.ZhTW.Value, n.EnUS.Value
}

func vndbIDOf(refs []catalogRef) string {
	for _, r := range refs {
		if r.Source == "vndb" && isVndbWorkID(r.ExternalID) {
			return r.ExternalID
		}
	}
	return ""
}

func isVndbWorkID(s string) bool {
	if len(s) < 2 || s[0] != 'v' {
		return false
	}
	for i := 1; i < len(s); i++ {
		if s[i] < '0' || s[i] > '9' {
			return false
		}
	}
	return true
}

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

func claimStateOf(c *catalogClaimedBy) string {
	if c == nil || !isGIDClaimSite(c.Site) {
		return ""
	}
	return c.State
}

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
	if ja == "" && zhCN == "" && zhTW == "" && en == "" {
		b.NameJaJp = it.DisplayName
	}
	return b
}

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

// Source rows first: the names block elects source over machine before it
// reaches us, but the detail face's titles[] is every row and carries no such
// order, so first-row-wins there would show a machine title for a locale that
// has a real one.
func titleByProductKey(rows []catalogTitle) map[string]string {
	out := make(map[string]string, 4)
	for _, machine := range []bool{false, true} {
		for _, r := range rows {
			if r.Machine != machine {
				continue
			}
			k := productLangFromCatalog(r.Lang)
			switch k {
			case "ja-jp", "zh-cn", "zh-tw", "en-us":
				if _, taken := out[k]; !taken {
					out[k] = r.Title
				}
			}
		}
	}
	return out
}

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

func isLandscape(w, h int) bool {
	return w > 0 && h > 0 && int64(h)*20 <= int64(w)*21
}

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
	return f
}

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

func tagCategoryFor(sexual bool) string {
	if sexual {
		return "sexual"
	}
	return "content"
}

func catalogLabelToFullOfficial(gid int, l *catalogWorkLabel) GalgameFullOfficial {
	return GalgameFullOfficial{
		GalgameID:  gid,
		OfficialID: int(l.ID),
		Official: Official{
			ID:       int(l.ID),
			Name:     l.DisplayName,
			Category: l.LabelKind,
			Lang:     productLangFromCatalog(l.Lang),
			LogoHash: l.LogoHash,
		},
	}
}

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

func yearLowerBound(y int) string { return strconv.Itoa(y) + "-01-01" }
func yearUpperBound(y int) string { return strconv.Itoa(y) + "-12-31" }

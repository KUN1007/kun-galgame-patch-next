package handler

// Translation from moyu's publish-wizard form to the registry's submission
// field keys.
//
// It sits here rather than in the catalog client on purpose: the client speaks
// the contract, this file speaks moyu's form, and the mapping between them is
// where a vocabulary mismatch would otherwise hide. Every value is emitted in
// the shape the field's OWN validator on the registry accepts — a wrong shape
// is a 422 the submitter reads, never a half-written work, because the mint is
// one transaction.

import (
	"fmt"
	"strings"
)

// Registry field keys (catalog.work). Spelled out rather than imported: moyu
// does not link against the catalog service, and these are wire constants.
const (
	fieldWorkDisplayName   = "catalog.work.display_name"
	fieldWorkOLang         = "catalog.work.olang"
	fieldWorkContentRating = "catalog.work.content_rating"
	fieldWorkTitles        = "catalog.work.titles"
	fieldWorkIntros        = "catalog.work.intros"
	fieldWorkDisplayNSFW   = "catalog.work.display_nsfw"
)

// Title kinds on catalog.work.titles.
const (
	titleKindOfficial = 0
	titleKindAlias    = 1
)

// Content ratings on catalog.work.content_rating.
const (
	contentRatingAllAges = 0
	contentRatingR18     = 2
)

// wizardLangs maps moyu's four form locales onto the registry's BCP-47
// vocabulary, in the order the display name falls back through.
//
// The two vocabularies are NOT the same and never were: moyu inherited the
// wiki's `ja-jp` / `zh-cn` / `zh-tw` / `en-us` column suffixes, while the
// registry uses the VNDB-derived list where Chinese is distinguished by SCRIPT
// (zh-Hans / zh-Hant), not by region. Sending the form's spelling straight
// through is a 422 on olang and on every title element.
var wizardLangs = []struct {
	form     string // the form field suffix / original_language value
	registry string
}{
	{"zh_cn", "zh-Hans"},
	{"zh_tw", "zh-Hant"},
	{"ja_jp", "ja"},
	{"en_us", "en"},
}

// registryLang translates one form locale. The registry's own spelling is
// accepted too — the two vocabularies share no value, so there is nothing to
// disambiguate, and a form that is later changed to emit registry codes should
// not start failing validation as a result.
//
// ok=false for anything in neither, which the caller refuses rather than
// guesses at: picking a language for somebody is how a work ends up filed under
// one nobody chose.
func registryLang(form string) (string, bool) {
	norm := strings.ReplaceAll(strings.TrimSpace(strings.ToLower(form)), "-", "_")
	for _, l := range wizardLangs {
		if l.form == norm || strings.EqualFold(l.registry, strings.TrimSpace(form)) {
			return l.registry, true
		}
	}
	return "", false
}

// SubmissionForm is the publish wizard's "submit a new work" payload, in moyu's
// own vocabulary.
type SubmissionForm struct {
	NameZhCn         string `json:"name_zh_cn"`
	NameZhTw         string `json:"name_zh_tw"`
	NameJaJp         string `json:"name_ja_jp"`
	NameEnUs         string `json:"name_en_us"`
	IntroZhCn        string `json:"intro_zh_cn"`
	Aliases          string `json:"aliases"`
	ContentLimit     string `json:"content_limit"`
	AgeLimit         string `json:"age_limit"`
	OriginalLanguage string `json:"original_language"`
}

func (f *SubmissionForm) nameFor(form string) string {
	switch form {
	case "zh_cn":
		return strings.TrimSpace(f.NameZhCn)
	case "zh_tw":
		return strings.TrimSpace(f.NameZhTw)
	case "ja_jp":
		return strings.TrimSpace(f.NameJaJp)
	case "en_us":
		return strings.TrimSpace(f.NameEnUs)
	}
	return ""
}

// SubmissionFields builds the registry payload, or an error naming what the
// submitter has to fix.
//
// display_name is required and is the FIRST non-empty name in the wizard's own
// fallback order — the same order every card on moyu renders by, so the entry a
// submitter sees in the review queue is titled the way they will see it on the
// site.
func (f *SubmissionForm) SubmissionFields() (map[string]any, error) {
	titles := make([]any, 0, len(wizardLangs)+4)
	displayName := ""
	for _, l := range wizardLangs {
		name := f.nameFor(l.form)
		if name == "" {
			continue
		}
		if displayName == "" {
			displayName = name
		}
		titles = append(titles, map[string]any{
			"lang": l.registry, "title": name, "kind": titleKindOfficial,
		})
	}
	if displayName == "" {
		return nil, fmt.Errorf("至少填写一个语言的名称")
	}

	// Aliases carry NO language — an alias is a string people search by, not a
	// localisation, and the registry's titles field accepts an empty lang for
	// exactly this kind (the alias lane the mirror step has always written).
	seen := map[string]struct{}{}
	for _, alias := range strings.Split(f.Aliases, ",") {
		alias = strings.TrimSpace(alias)
		if alias == "" {
			continue
		}
		if _, dup := seen[alias]; dup {
			continue
		}
		seen[alias] = struct{}{}
		titles = append(titles, map[string]any{
			"lang": "", "title": alias, "kind": titleKindAlias,
		})
	}

	olang, ok := registryLang(f.OriginalLanguage)
	if !ok {
		return nil, fmt.Errorf("原始语言不在可选范围内")
	}

	fields := map[string]any{
		fieldWorkDisplayName: displayName,
		fieldWorkOLang:       olang,
		fieldWorkTitles:      titles,
		// The two axes are independent and the wizard has always asked for both
		// separately: content_rating is the AGE gate, display_nsfw the EDITORIAL
		// display axis. Deriving one from the other is the doc 106 §38 incident
		// (94.5% of the live population is r18, barely 44% is edited nsfw).
		fieldWorkContentRating: contentRatingAllAges,
		fieldWorkDisplayNSFW:   strings.EqualFold(f.ContentLimit, "nsfw"),
	}
	if strings.EqualFold(f.AgeLimit, "r18") {
		fields[fieldWorkContentRating] = contentRatingR18
	}

	// The intro box is simplified Chinese only, as the form is.
	if intro := strings.TrimSpace(f.IntroZhCn); intro != "" {
		fields[fieldWorkIntros] = []any{
			map[string]any{"lang": "zh-Hans", "intro": intro},
		}
	}
	return fields, nil
}

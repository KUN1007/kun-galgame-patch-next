package handler

// The wizard form and the registry speak different vocabularies for the same
// four languages, and a mismatch is a 422 the submitter cannot act on. Every
// value below is checked against the shape the field's own validator on the
// registry accepts.

import (
	"testing"
)

func fieldsOf(t *testing.T, f SubmissionForm) map[string]any {
	t.Helper()
	out, err := f.SubmissionFields()
	if err != nil {
		t.Fatalf("SubmissionFields: %v", err)
	}
	return out
}

func TestSubmissionMapsLocalesOntoTheRegistryVocabulary(t *testing.T) {
	fields := fieldsOf(t, SubmissionForm{
		NameZhCn: " 你和她和她的恋爱 ", NameJaJp: "君と彼女と彼女の恋",
		OriginalLanguage: "ja-jp", ContentLimit: "nsfw", AgeLimit: "r18",
	})

	// zh-cn / ja-jp are moyu's inherited wiki column suffixes. The registry
	// distinguishes Chinese by SCRIPT and has no region tags at all, so sending
	// the form's spelling straight through is a validation failure on olang and
	// on every title element.
	if got := fields[fieldWorkOLang]; got != "ja" {
		t.Errorf("olang = %v, want ja (not the form's ja-jp)", got)
	}
	titles, _ := fields[fieldWorkTitles].([]any)
	if len(titles) != 2 {
		t.Fatalf("titles = %d, want 2", len(titles))
	}
	// Order follows the wizard's own display fallback, so the first official
	// title is the one the display name was taken from.
	first, _ := titles[0].(map[string]any)
	if first["lang"] != "zh-Hans" || first["title"] != "你和她和她的恋爱" {
		t.Errorf("titles[0] = %v, want the trimmed zh-Hans name first", first)
	}
	if first["kind"] != titleKindOfficial {
		t.Errorf("titles[0].kind = %v, want official", first["kind"])
	}
	second, _ := titles[1].(map[string]any)
	if second["lang"] != "ja" {
		t.Errorf("titles[1].lang = %v, want ja", second["lang"])
	}
	if got := fields[fieldWorkDisplayName]; got != "你和她和她的恋爱" {
		t.Errorf("display_name = %v, want the first non-empty name, trimmed", got)
	}
}

// The two rating axes are independent, and the wizard has always asked for them
// separately. Deriving one from the other is the doc 106 §38 incident.
func TestSubmissionKeepsTheTwoRatingAxesApart(t *testing.T) {
	cases := []struct {
		limit, age  string
		wantNSFW    bool
		wantRatingV any
	}{
		{"sfw", "all", false, contentRatingAllAges},
		{"nsfw", "all", true, contentRatingAllAges},
		{"sfw", "r18", false, contentRatingR18},
		{"nsfw", "r18", true, contentRatingR18},
	}
	for _, tc := range cases {
		t.Run(tc.limit+"/"+tc.age, func(t *testing.T) {
			fields := fieldsOf(t, SubmissionForm{
				NameEnUs: "A", OriginalLanguage: "en",
				ContentLimit: tc.limit, AgeLimit: tc.age,
			})
			if got := fields[fieldWorkDisplayNSFW]; got != tc.wantNSFW {
				t.Errorf("display_nsfw = %v, want %v", got, tc.wantNSFW)
			}
			if got := fields[fieldWorkContentRating]; got != tc.wantRatingV {
				t.Errorf("content_rating = %v, want %v", got, tc.wantRatingV)
			}
		})
	}
}

// An alias is a string people search by, not a localisation, so it carries no
// language — which is exactly the lane the registry's titles field opened for
// empty-lang alias rows.
func TestSubmissionAliasesAreLanguagelessAndDeduped(t *testing.T) {
	fields := fieldsOf(t, SubmissionForm{
		NameEnUs: "Muv-Luv", OriginalLanguage: "en",
		Aliases: " ML , マブラヴ ,ML,  ,", ContentLimit: "sfw", AgeLimit: "all",
	})
	titles, _ := fields[fieldWorkTitles].([]any)
	if len(titles) != 3 {
		t.Fatalf("titles = %d, want 1 official + 2 deduped aliases", len(titles))
	}
	for _, el := range titles[1:] {
		obj, _ := el.(map[string]any)
		if obj["lang"] != "" {
			t.Errorf("alias %v carries a language; aliases have none", obj)
		}
		if obj["kind"] != titleKindAlias {
			t.Errorf("alias %v is not marked as one", obj)
		}
	}
}

func TestSubmissionIntroIsSimplifiedChineseOnly(t *testing.T) {
	fields := fieldsOf(t, SubmissionForm{
		NameEnUs: "A", OriginalLanguage: "en", ContentLimit: "sfw", AgeLimit: "all",
		IntroZhCn: "  说明  ",
	})
	intros, _ := fields[fieldWorkIntros].([]any)
	if len(intros) != 1 {
		t.Fatalf("intros = %d, want 1", len(intros))
	}
	obj, _ := intros[0].(map[string]any)
	if obj["lang"] != "zh-Hans" || obj["intro"] != "说明" {
		t.Errorf("intro = %v, want the trimmed text under zh-Hans", obj)
	}

	// An empty box must not emit the key at all: an empty intro LIST is a
	// meaningful value on a full-replacement field, and sending one on a mint
	// would be asserting "this work has no introductions" rather than "the
	// submitter did not write one".
	bare := fieldsOf(t, SubmissionForm{
		NameEnUs: "A", OriginalLanguage: "en", ContentLimit: "sfw", AgeLimit: "all",
	})
	if _, present := bare[fieldWorkIntros]; present {
		t.Error("an empty intro box emitted the intros key")
	}
}

func TestSubmissionRefusesWhatItCannotTranslate(t *testing.T) {
	// No name at all: display_name is required and this face does not invent one.
	if _, err := (&SubmissionForm{OriginalLanguage: "en"}).SubmissionFields(); err == nil {
		t.Error("a nameless submission was accepted")
	}
	// A language outside the form's own vocabulary is refused here rather than
	// forwarded to fail validation upstream with a message about BCP-47.
	if _, err := (&SubmissionForm{NameEnUs: "A", OriginalLanguage: "kr"}).SubmissionFields(); err == nil {
		t.Error("an unknown original language was accepted")
	}
}

// Only keys the registry's submission subset accepts may be emitted. Covers and
// screenshots are the notable absentees: their bytes must exist in the image
// store before anything references them.
func TestSubmissionEmitsOnlyAcceptedKeys(t *testing.T) {
	accepted := map[string]struct{}{
		fieldWorkDisplayName: {}, fieldWorkOLang: {}, fieldWorkContentRating: {},
		fieldWorkTitles: {}, fieldWorkIntros: {}, fieldWorkDisplayNSFW: {},
	}
	fields := fieldsOf(t, SubmissionForm{
		NameZhCn: "甲", NameZhTw: "乙", NameJaJp: "丙", NameEnUs: "D",
		IntroZhCn: "说明", Aliases: "x", OriginalLanguage: "zh-cn",
		ContentLimit: "nsfw", AgeLimit: "r18",
	})
	for key := range fields {
		if _, ok := accepted[key]; !ok {
			t.Errorf("emitted %q, which the submission face does not accept", key)
		}
	}
	if got := fields[fieldWorkOLang]; got != "zh-Hans" {
		t.Errorf("olang = %v, want zh-Hans", got)
	}
}

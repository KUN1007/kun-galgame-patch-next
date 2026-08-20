package client

import (
	"encoding/json"
	"os"
	"slices"
	"testing"
)

// The hand-written fakes in this package have twice kept the suite green while a
// catalog wave took production down (aliases[] in wave 209, the names block in
// wave 210): a fake serving the retired shape can never disagree with the code
// that reads it. This golden is a real /v1/catalog/works/3 response, read from
// prod on 2026-08-19 and trimmed to a few rows per array with every key intact.
// Refresh it by re-reading the live face, not by editing it to match the code.
func TestProdWorkDetailDecodes(t *testing.T) {
	raw, err := os.ReadFile("testdata/catalog_work_detail_prod.json")
	if err != nil {
		t.Fatalf("read golden: %v", err)
	}
	var w catalogWork
	if err := json.Unmarshal(raw, &w); err != nil {
		t.Fatalf("decode: %v — one mismatched field type fails the WHOLE response", err)
	}
	full := catalogWorkToFull(&w)

	if full.ID != 3 || full.VndbID != "v12984" {
		t.Fatalf("identity = (%d, %q), want (3, v12984)", full.ID, full.VndbID)
	}
	if full.NameZhCn == "" || full.NameJaJp == "" {
		t.Errorf("names = (%q, %q), want both filled from localized{}", full.NameZhCn, full.NameJaJp)
	}
	if full.IntroZhCn == "" {
		t.Error("intro_zh_cn is empty — the intros block did not reach the reader")
	}

	t.Run("roster", func(t *testing.T) {
		if len(full.Characters) == 0 {
			t.Fatal("no characters — the roster is unconditional on the detail face")
		}
		first := full.Characters[0]
		if first.Name != "科罗娜" {
			t.Errorf("character[0] = %q, want the zh-Hans row", first.Name)
		}
		if first.ImageHash == "" || first.FigureHash == "" {
			t.Errorf("character[0] art = (%q, %q), want both hashes", first.ImageHash, first.FigureHash)
		}
		if len(first.Voices) == 0 {
			t.Error("character[0] has no CV — voices[] is where the roster names them")
		}
	})

	t.Run("credits fold onto one role per job", func(t *testing.T) {
		keys := make([]string, 0, len(full.Staff))
		for _, g := range full.Staff {
			keys = append(keys, g.RoleKey)
		}
		for _, dead := range []string{"剧本", "原画", "音乐", "director-direction", "developer"} {
			if slices.Contains(keys, dead) {
				t.Errorf("role %q survived the fold: %v", dead, keys)
			}
		}
		for _, want := range []string{"scenario", "illustration", "music", "director"} {
			if !slices.Contains(keys, want) {
				t.Errorf("role %q missing after the fold: %v", want, keys)
			}
		}
	})

	t.Run("ratings", func(t *testing.T) {
		if len(full.Ratings) != 2 {
			t.Fatalf("ratings = %+v, want vndb and bangumi", full.Ratings)
		}
		for _, r := range full.Ratings {
			if len(r.Distribution) == 0 {
				t.Errorf("%s carries no histogram — which sources have one changes over time, so this is a warning, not a contract", r.Source)
			}
		}
	})

	t.Run("cover slots", func(t *testing.T) {
		if full.EffectivePortraitHash == "" {
			t.Error("no portrait hash — the patch header renders a 3/4 box from it")
		}
		if full.EffectivePortraitWidth != 850 || full.EffectivePortraitHeight != 1080 {
			t.Errorf("portrait dims = %dx%d, want the slot's own",
				full.EffectivePortraitWidth, full.EffectivePortraitHeight)
		}
	})
}

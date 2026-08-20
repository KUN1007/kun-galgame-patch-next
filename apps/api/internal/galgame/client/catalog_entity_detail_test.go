package client

import (
	"encoding/json"
	"os"
	"slices"
	"testing"
)

// Both goldens are real responses read from prod on 2026-08-20 and trimmed to a
// few rows per array with every key intact. Refresh them by re-reading the live
// face, not by editing them to match the code — see catalog_golden_test.go for
// the two waves that got past hand-written fakes.
func loadGolden[T any](t *testing.T, name string) T {
	t.Helper()
	raw, err := os.ReadFile("testdata/" + name)
	if err != nil {
		t.Fatalf("read golden: %v", err)
	}
	var out T
	if err := json.Unmarshal(raw, &out); err != nil {
		t.Fatalf("decode: %v — one mismatched field type fails the WHOLE response", err)
	}
	return out
}

func TestProdCharacterDetailDecodes(t *testing.T) {
	wire := loadGolden[catalogCharacterDetail](t, "catalog_character_detail_prod.json")
	ch := catalogCharacterToDetail(&wire, true)

	if ch.ID != 1699 || ch.Name.JaJp != "コロナ" || ch.Name.ZhCn != "科罗娜" {
		t.Fatalf("identity = (%d, %+v), want 1699 under both names", ch.ID, ch.Name)
	}
	if ch.ImageHash == "" || ch.FigureHash == "" {
		t.Errorf("art = (%q, %q), want hashes off both URLs", ch.ImageHash, ch.FigureHash)
	}
	if !slices.Contains(ch.Aliases, "Corona") {
		t.Errorf("aliases = %v, want the wave-209 alias rows read as values", ch.Aliases)
	}

	t.Run("traits render in Chinese", func(t *testing.T) {
		if len(ch.Traits) == 0 {
			t.Fatal("no traits survived")
		}
		if ch.Traits[0].Name != "金发" || ch.Traits[0].Group != "毛发" {
			t.Errorf("trait[0] = %+v, want the localized vocabulary, not Blond/Hair", ch.Traits[0])
		}
		if !slices.ContainsFunc(ch.Traits, func(tr GalgameCharacterTrait) bool { return tr.Spoiler > 0 }) {
			t.Error("no spoiler trait — the modal gates them behind a reveal, so it needs one")
		}
	})

	t.Run("sfw callers do not see the sexual traits", func(t *testing.T) {
		for _, tr := range ch.Traits {
			if tr.Name == "坐姿性交" || tr.Group == "性行为" {
				t.Fatalf("sexual trait %q reached an sfw reader", tr.Name)
			}
		}
		if nsfw := catalogCharacterToDetail(&wire, false); len(nsfw.Traits) <= len(ch.Traits) {
			t.Errorf("nsfw traits = %d, sfw = %d — the filter dropped nothing",
				len(nsfw.Traits), len(ch.Traits))
		}
	})

	t.Run("intros land on moyu's language keys", func(t *testing.T) {
		langs := make([]string, 0, len(ch.Intros))
		for _, intro := range ch.Intros {
			langs = append(langs, intro.Lang)
		}
		for _, want := range []string{"en-us", "ja-jp", "zh-cn"} {
			if !slices.Contains(langs, want) {
				t.Errorf("intro langs = %v, want %s among them", langs, want)
			}
		}
		for _, intro := range ch.Intros {
			if intro.Lang == "zh-cn" && !intro.Machine {
				t.Error("the zh intro lost its machine flag — the reader is told when it is a translation")
			}
			if intro.Source == "bangumi" {
				t.Error("the intro credit still prints catalog's source key rather than Bangumi")
			}
		}
	})

	t.Run("external links", func(t *testing.T) {
		if len(ch.Links) == 0 {
			t.Fatal("no links built from refs")
		}
		if !slices.ContainsFunc(ch.Links, func(l GalgameEntityLink) bool { return l.URL == "https://vndb.org/c17039" }) {
			t.Errorf("links = %+v, want vndb's own c-prefixed id used verbatim", ch.Links)
		}
	})
}

func TestProdNameDetailDecodes(t *testing.T) {
	wire := loadGolden[catalogNameDetail](t, "catalog_name_detail_prod.json")
	n := catalogNameToDetail(&wire)

	if n.ID != 1550 || n.Name.JaJp != "榎木実佳" || n.Name.ZhCn != "榎木实佳" {
		t.Fatalf("identity = (%d, %+v), want 1550 under both names", n.ID, n.Name)
	}
	if n.PhotoHash == "" {
		t.Error("photo_hash is empty — the modal renders an avatar from it")
	}
	if n.Gender != 2 || n.BirthM != 8 || n.BirthD != 21 {
		t.Errorf("profile = (gender %d, %d-%d), want the nullable columns unwrapped", n.Gender, n.BirthM, n.BirthD)
	}
	if len(n.Siblings) == 0 {
		t.Error("no siblings — a voice actor's other 名义 are the point of the person link")
	}

	t.Run("credits carry the moyu id where a galgame stands on the work", func(t *testing.T) {
		if len(n.Credits) == 0 {
			t.Fatal("no credits — the request asks for include=credits")
		}
		first := n.Credits[0]
		if first.GalgameID == 0 {
			t.Errorf("credit[0] = %+v, want the kungal claim read as a moyu galgame id", first)
		}
		if first.Name.canonical() == "" || len(first.Roles) == 0 {
			t.Errorf("credit[0] = %+v, want the work named and its roles kept", first)
		}
		if first.Roles[0].RoleName == "" {
			t.Error("role name is empty")
		}
	})

	t.Run("links merge the refs with catalog's own rows", func(t *testing.T) {
		var hasVndb, hasSite bool
		for _, l := range n.Links {
			if l.URL == "https://vndb.org/s26940" {
				hasVndb = true
			}
			if l.Name == "官方网站" {
				hasSite = true
			}
		}
		if !hasVndb {
			t.Errorf("links = %+v, want a person's bare vndb id prefixed with s", n.Links)
		}
		if !hasSite {
			t.Errorf("links = %+v, want catalog's own link rows kept beside the refs", n.Links)
		}
	})
}

// Name 900 is credited on work 3 as other-staff, scenario AND 剧本 — the same
// job written by two sources plus a catch-all. Rendering the roles as they
// arrive prints "其他 · 脚本 · 脚本" under the work.
func TestProdNameCreditsFoldOneRolePerJob(t *testing.T) {
	wire := loadGolden[catalogNameDetail](t, "catalog_name_credits_prod.json")
	n := catalogNameToDetail(&wire)

	if len(n.Credits) == 0 {
		t.Fatal("no credits")
	}
	for _, credit := range n.Credits {
		seen := make(map[string]bool, len(credit.Roles))
		for _, role := range credit.Roles {
			key := role.RoleKey + "\x00" + role.Character
			if seen[key] {
				t.Errorf("%s repeats %q: %+v", credit.Name.canonical(), role.RoleName, credit.Roles)
			}
			seen[key] = true
		}
	}
	first := n.Credits[0]
	if len(first.Roles) != 2 || first.Roles[0].RoleKey != "scenario" {
		t.Errorf("roles = %+v, want 脚本 before the other-staff catch-all", first.Roles)
	}
}

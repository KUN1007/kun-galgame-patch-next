package client

import (
	"context"
	"slices"
	"testing"
)

func TestDetailCarriesTheCatalogEntityGraph(t *testing.T) {
	srv := newCatalogFake(t)
	c := NewWithKey(srv.URL, "nm_test_key")
	ctx := context.Background()

	env, err := c.GetGalgame(ctx, 7, "")
	if err != nil {
		t.Fatalf("GetGalgame: %v", err)
	}
	g := &env.Galgame

	t.Run("the request asks for credits", func(t *testing.T) {
		if got := srv.last().query.Get("include"); got != "credits" {
			t.Fatalf("include = %q, want credits — the detail face omits the block otherwise", got)
		}
	})

	t.Run("characters render under their Chinese name", func(t *testing.T) {
		if len(g.Characters) != 2 {
			t.Fatalf("characters = %d, want 2", len(g.Characters))
		}
		first := g.Characters[0]
		if first.Name != "科罗娜" || first.NameOriginal != "コロナ" {
			t.Errorf("character = (%q, %q), want (科罗娜, コロナ)", first.Name, first.NameOriginal)
		}
		if first.ImageHash != "chara1" || first.FigureHash != "figure1" {
			t.Errorf("art = (%q, %q), want the URL basenames", first.ImageHash, first.FigureHash)
		}
		if len(first.Voices) != 1 || first.Voices[0].Name != "榎木实佳" || first.Voices[0].ID != 1550 {
			t.Errorf("voices = %+v, want the zh name under catalog's name id", first.Voices)
		}
		if second := g.Characters[1]; second.Name != "雪々" || second.NameOriginal != "" {
			t.Errorf("character[1] = (%q, %q), want (雪々, \"\") — no second line when it would repeat", second.Name, second.NameOriginal)
		}
	})

	t.Run("staff folds the source vocabularies onto one role", func(t *testing.T) {
		keys := make([]string, 0, len(g.Staff))
		for _, group := range g.Staff {
			keys = append(keys, group.RoleKey)
		}
		want := []string{"scenario", "illustration", "voice-actor", "other-staff"}
		if !slices.Equal(keys, want) {
			t.Fatalf("role keys = %v, want %v", keys, want)
		}

		scenario := g.Staff[0]
		if scenario.RoleName != "脚本" {
			t.Errorf("scenario role name = %q, want the pinned 脚本", scenario.RoleName)
		}
		if len(scenario.People) != 2 {
			t.Fatalf("scenario people = %+v, want both vocabularies' credits in one group", scenario.People)
		}
		if scenario.People[1].Name != "丸户史明" {
			t.Errorf("scenario[1] = %q, want the zh name", scenario.People[1].Name)
		}

		voice := g.Staff[2]
		if len(voice.People) != 1 || !slices.Equal(voice.People[0].Characters, []string{"コロナ"}) {
			t.Errorf("voice-actor = %+v, want the character annotation carried", voice.People)
		}

		other := g.Staff[3]
		if len(other.People) != 1 || other.People[0].Name != "なかひろ" {
			t.Errorf("other-staff = %+v, want 保住圭 dropped — it already ran under 脚本", other.People)
		}
	})

	t.Run("developer stays out of the staff list", func(t *testing.T) {
		for _, group := range g.Staff {
			if group.RoleKey == "developer" {
				t.Fatal("developer reached the staff list — the 会社 chips already name it")
			}
		}
	})

	t.Run("ratings keep each source's own scale", func(t *testing.T) {
		if len(g.Ratings) != 2 {
			t.Fatalf("ratings = %+v, want dlsite dropped for having no votes", g.Ratings)
		}
		if g.Ratings[0].Source != "vndb" || g.Ratings[0].Score != 8.1 {
			t.Errorf("ratings[0] = %+v, want vndb 8.1 verbatim", g.Ratings[0])
		}
		ero := g.Ratings[1]
		if ero.Score != 78.5 {
			t.Errorf("erogamescape score = %v, want 78.5 on its own 0-100 scale", ero.Score)
		}
		if ero.Rank == nil || *ero.Rank != 2917 {
			t.Errorf("erogamescape rank = %v, want 2917", ero.Rank)
		}
		if len(ero.Distribution) != 2 || ero.Distribution[0].Score != 70 {
			t.Errorf("erogamescape distribution = %+v, want its decile buckets", ero.Distribution)
		}
	})

	t.Run("the portrait slot reaches the header", func(t *testing.T) {
		if g.EffectivePortraitHash != "hash3" {
			t.Errorf("portrait hash = %q, want cover_slots.portrait", g.EffectivePortraitHash)
		}
		if g.EffectivePortraitWidth != 850 || g.EffectivePortraitHeight != 1080 {
			t.Errorf("portrait dims = %dx%d, want 850x1080", g.EffectivePortraitWidth, g.EffectivePortraitHeight)
		}
		if g.EffectiveBannerHash != "hash2" {
			t.Errorf("banner hash = %q, want the landscape cover — the portrait must not displace it", g.EffectiveBannerHash)
		}
	})
}

func TestListBriefCarriesThePortraitSlot(t *testing.T) {
	srv := newCatalogFake(t)
	c := NewWithKey(srv.URL, "nm_test_key")

	briefs, err := c.GalgameBatch(context.Background(), []int{7}, "")
	if err != nil {
		t.Fatalf("GalgameBatch: %v", err)
	}
	if len(briefs) != 1 {
		t.Fatalf("briefs = %d, want 1", len(briefs))
	}
	if got := briefs[0].EffectivePortraitHash; got != "hash1" {
		t.Errorf("portrait hash = %q, want covers.portrait", got)
	}
	if got := briefs[0].EffectiveBannerHash; got != "hash2" {
		t.Errorf("banner hash = %q, want covers.banner", got)
	}
}

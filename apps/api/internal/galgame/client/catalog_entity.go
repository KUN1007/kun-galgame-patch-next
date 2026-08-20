package client

import (
	"slices"
	"sort"
	"strings"
)

// catalogPersonRef is how the public face names a person inside another record:
// a roster voice or a credit row. The id is catalog's NAME id, which is what
// kungal's /galgame/staff/:id takes — not the person id behind it.
type catalogPersonRef struct {
	ID          int64                           `json:"id"`
	DisplayName string                          `json:"display_name"`
	Lang        string                          `json:"lang"`
	Latin       string                          `json:"latin"`
	Localized   map[string]catalogLocalizedName `json:"localized"`
}

type catalogWorkCharacter struct {
	ID          int64                           `json:"id"`
	DisplayName string                          `json:"display_name"`
	Localized   map[string]catalogLocalizedName `json:"localized"`
	Latin       string                          `json:"latin"`
	Kind        string                          `json:"kind"`
	Spoiler     int                             `json:"spoiler"`
	Image       string                          `json:"image"`
	Figure      string                          `json:"figure"`
	Voices      []catalogPersonRef              `json:"voices"`
}

type catalogCreditItem struct {
	catalogPersonRef
	CharacterID int64  `json:"character_id"`
	Character   string `json:"character"`
}

type catalogCreditGroup struct {
	RoleKey  string              `json:"role_key"`
	RoleName string              `json:"role_name"`
	Credits  []catalogCreditItem `json:"credits"`
}

type catalogRatingBucket struct {
	Score int `json:"score"`
	Count int `json:"count"`
}

type catalogRating struct {
	Source       string                `json:"source"`
	Score        float64               `json:"score"`
	VoteCount    int                   `json:"vote_count"`
	Rank         *int                  `json:"rank"`
	Distribution []catalogRatingBucket `json:"distribution"`
}

// GalgamePersonRef is one credited person. ID deep-links kungal's staff page.
type GalgamePersonRef struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type GalgameCharacter struct {
	ID           int                `json:"id"`
	Name         string             `json:"name"`
	NameOriginal string             `json:"name_original,omitempty"`
	Kind         string             `json:"kind"`
	Spoiler      int                `json:"spoiler"`
	ImageHash    string             `json:"image_hash,omitempty"`
	FigureHash   string             `json:"figure_hash,omitempty"`
	Voices       []GalgamePersonRef `json:"voices"`
}

type GalgameStaffMember struct {
	ID         int      `json:"id"`
	Name       string   `json:"name"`
	Characters []string `json:"characters,omitempty"`
}

type GalgameStaffGroup struct {
	RoleKey  string               `json:"role_key"`
	RoleName string               `json:"role_name"`
	People   []GalgameStaffMember `json:"people"`
}

type GalgameRatingBucket struct {
	Score int `json:"score"`
	Count int `json:"count"`
}

// GalgameRating is one external source's aggregate. Score sits on that source's
// own scale — vndb and bangumi 0-10, erogamescape 0-100, dlsite 0-5 — and
// catalog never normalizes between them, so nothing may compare two sources'
// scores without dividing by the per-source maximum the frontend holds.
// Distribution buckets are likewise the source's own: erogamescape's are
// deciles, everyone else's are points.
type GalgameRating struct {
	Source       string                `json:"source"`
	Score        float64               `json:"score"`
	VoteCount    int                   `json:"vote_count"`
	Rank         *int                  `json:"rank,omitempty"`
	Distribution []GalgameRatingBucket `json:"distribution,omitempty"`
}

var catalogZhLocales = []string{"zh-Hans", "zh", "zh-Hant"}

// catalogEntityName renders the Chinese name where catalog has one, otherwise
// the entity's own. Unlike the work title this does not fold onto moyu's four
// name columns: a person or a character is shown under one name, not four.
func catalogEntityName(localized map[string]catalogLocalizedName, displayName, latin string) string {
	for _, tag := range catalogZhLocales {
		if row, ok := localized[tag]; ok && row.Value != "" {
			return row.Value
		}
	}
	if displayName != "" {
		return displayName
	}
	return latin
}

func (p *catalogPersonRef) name() string {
	return catalogEntityName(p.Localized, p.DisplayName, p.Latin)
}

func catalogCharacters(rows []catalogWorkCharacter) []GalgameCharacter {
	out := make([]GalgameCharacter, 0, len(rows))
	for i := range rows {
		c := &rows[i]
		name := catalogEntityName(c.Localized, c.DisplayName, c.Latin)
		if name == "" {
			continue
		}
		voices := make([]GalgamePersonRef, 0, len(c.Voices))
		for j := range c.Voices {
			v := &c.Voices[j]
			if n := v.name(); n != "" {
				voices = append(voices, GalgamePersonRef{ID: int(v.ID), Name: n})
			}
		}
		ch := GalgameCharacter{
			ID:         int(c.ID),
			Name:       name,
			Kind:       c.Kind,
			Spoiler:    c.Spoiler,
			ImageHash:  hashFromURL(c.Image),
			FigureHash: hashFromURL(c.Figure),
			Voices:     voices,
		}
		if c.DisplayName != "" && c.DisplayName != name {
			ch.NameOriginal = c.DisplayName
		}
		out = append(out, ch)
	}
	return out
}

// One work carries the same role under several keys, because each source names
// it in its own vocabulary: work 3 alone ships scenario AND 剧本, illustration
// AND 原画, music AND 音乐. Reading the keys as given renders every one of those
// as a separate 制作人员 row.
var catalogRoleFold = map[string]string{
	"剧本":                 "scenario",
	"原画":                 "illustration",
	"音乐":                 "music",
	"director-direction": "director",
}

var catalogRoleName = map[string]string{
	"scenario":     "脚本",
	"illustration": "原画",
	"music":        "音乐",
	"director":     "导演",
}

var catalogRoleOrder = []string{
	"原作",
	"scenario",
	"illustration",
	"character-design",
	"music",
	"voice-actor",
	"director",
	"composer",
	"lyric",
	"arrange",
	"vocal",
	"theme-song-composition",
	"theme-song-lyrics",
	"theme-song-performance",
	"inserted-song-performance",
}

// developer / publisher already render as the 会社 chips above the staff list.
var catalogRoleHidden = map[string]bool{"developer": true, "publisher": true}

const catalogRoleLast = "other-staff"

func catalogStaff(groups []catalogCreditGroup) []GalgameStaffGroup {
	type bucket struct {
		name   string
		people []GalgameStaffMember
		at     map[string]int
	}
	order := make([]string, 0, len(groups))
	byKey := make(map[string]*bucket, len(groups))

	for gi := range groups {
		g := &groups[gi]
		if catalogRoleHidden[g.RoleKey] {
			continue
		}
		key := g.RoleKey
		if folded, ok := catalogRoleFold[key]; ok {
			key = folded
		}
		b := byKey[key]
		if b == nil {
			b = &bucket{name: g.RoleName, at: map[string]int{}}
			byKey[key] = b
			order = append(order, key)
		}
		if pinned, ok := catalogRoleName[key]; ok {
			b.name = pinned
		} else if b.name == "" {
			b.name = g.RoleName
		}
		for ci := range g.Credits {
			c := &g.Credits[ci]
			name := c.name()
			norm := normalizeCreditName(name)
			if norm == "" {
				continue
			}
			i, seen := b.at[norm]
			if !seen {
				b.at[norm] = len(b.people)
				b.people = append(b.people, GalgameStaffMember{ID: int(c.ID), Name: name})
				i = len(b.people) - 1
			} else if len(name) < len(b.people[i].Name) {
				b.people[i].Name = name
			}
			if c.Character != "" {
				b.people[i].Characters = appendUniqueString(b.people[i].Characters, c.Character)
			}
		}
	}

	if other := byKey[catalogRoleLast]; other != nil {
		elsewhere := make(map[string]bool)
		for key, b := range byKey {
			if key == catalogRoleLast {
				continue
			}
			for norm := range b.at {
				elsewhere[norm] = true
			}
		}
		kept := other.people[:0]
		for _, p := range other.people {
			if !elsewhere[normalizeCreditName(p.Name)] {
				kept = append(kept, p)
			}
		}
		other.people = kept
	}

	rank := make(map[string]int, len(catalogRoleOrder))
	for i, key := range catalogRoleOrder {
		rank[key] = i
	}
	arrival := make(map[string]int, len(order))
	for i, key := range order {
		arrival[key] = i
	}
	weight := func(key string) int {
		if key == catalogRoleLast {
			return len(catalogRoleOrder) + 1
		}
		if r, ok := rank[key]; ok {
			return r
		}
		return len(catalogRoleOrder)
	}
	sort.SliceStable(order, func(i, j int) bool {
		wi, wj := weight(order[i]), weight(order[j])
		if wi != wj {
			return wi < wj
		}
		return arrival[order[i]] < arrival[order[j]]
	})

	out := make([]GalgameStaffGroup, 0, len(order))
	for _, key := range order {
		b := byKey[key]
		if len(b.people) == 0 {
			continue
		}
		out = append(out, GalgameStaffGroup{RoleKey: key, RoleName: b.name, People: b.people})
	}
	return out
}

// The same person reaches moyu as "保住圭" from one source and "保住圭 (Hozumi
// Kei)" from another; the parenthetical and the spacing are all that differ.
func normalizeCreditName(name string) string {
	if i := strings.IndexAny(name, "(（"); i >= 0 {
		name = name[:i]
	}
	return strings.Map(func(r rune) rune {
		if r == ' ' || r == '\t' || r == '　' {
			return -1
		}
		return r
	}, name)
}

func appendUniqueString(slice []string, val string) []string {
	if val == "" || slices.Contains(slice, val) {
		return slice
	}
	return append(slice, val)
}

func catalogRatings(rows []catalogRating) []GalgameRating {
	out := make([]GalgameRating, 0, len(rows))
	for i := range rows {
		r := &rows[i]
		if r.Source == "" || r.VoteCount <= 0 {
			continue
		}
		buckets := make([]GalgameRatingBucket, 0, len(r.Distribution))
		for _, b := range r.Distribution {
			buckets = append(buckets, GalgameRatingBucket{Score: b.Score, Count: b.Count})
		}
		out = append(out, GalgameRating{
			Source:       r.Source,
			Score:        r.Score,
			VoteCount:    r.VoteCount,
			Rank:         r.Rank,
			Distribution: buckets,
		})
	}
	return out
}

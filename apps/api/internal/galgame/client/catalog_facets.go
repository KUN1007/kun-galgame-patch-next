package client

import (
	"context"
	"sort"

	"kun-galgame-patch-api/pkg/catalogv2"
)

// GalgameCardTag is one tag a list card prints. The id deep-links the tag page.
type GalgameCardTag struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// GalgameFacet is what a card shows once it has room for more than a title:
// the two credits a reader picks a game by, and a short shelf of tags.
type GalgameFacet struct {
	Scenario     []KunLanguage    `json:"scenario,omitempty"`
	Illustration []KunLanguage    `json:"illustration,omitempty"`
	Tags         []GalgameCardTag `json:"tags,omitempty"`
}

func (f GalgameFacet) empty() bool {
	return len(f.Scenario) == 0 && len(f.Illustration) == 0 && len(f.Tags) == 0
}

const (
	facetStaffMax = 2
	facetTagMax   = 6
)

// Both blocks ride the works list face; asking for tags there answers the
// spoiler=none ceiling, which is the one the shelf wants.
var facetInclude = []string{"tags", "credits"}

type facetTag struct {
	id     int
	name   string
	sexual bool
}

type facetEntry struct {
	scenario     []KunLanguage
	illustration []KunLanguage
	tags         []facetTag
}

// GalgameFacets answers the card facet for each gid it can reach. A facet is
// decoration: a work catalog refuses or fails to answer for is simply absent
// from the map, and the list it was built for still renders. Both gates stay
// open — the caller already decided which works it may show, and this read only
// distills their tags and credits.
func (c *Client) GalgameFacets(ctx context.Context, gids []int, contentLimit string) map[int]GalgameFacet {
	out := make(map[int]GalgameFacet, len(gids))
	if c == nil || len(gids) == 0 {
		return out
	}
	byGID, err := c.resolveGIDs(ctx, gids)
	if err != nil || len(byGID) == 0 {
		return out
	}

	ids := make([]int64, 0, len(byGID))
	seen := make(map[int64]bool, len(byGID))
	for _, id := range byGID {
		if !seen[id] {
			seen[id] = true
			ids = append(ids, id)
		}
	}
	page, err := c.v2.ListWorks(ctx, catalogv2.WorksQuery{
		IDs: ids, NSFW: true, Include: facetInclude, Limit: CatalogWorksIDsMax,
	})
	if err != nil {
		return out
	}

	entries := make(map[int64]facetEntry, len(page.Items))
	for i := range page.Items {
		id, ok := page.Items[i].IntID()
		if !ok {
			continue
		}
		entries[id] = facetFrom(catalogWork{
			Tags:    workTags(page.Items[i]),
			Credits: workCredits(page.Items[i]),
		})
	}

	sexualOK := gateFor(contentLimit).contentLimit != "sfw"
	for gid, id := range byGID {
		if f := entries[id].facet(sexualOK); !f.empty() {
			out[gid] = f
		}
	}
	return out
}

func (e facetEntry) facet(sexualOK bool) GalgameFacet {
	f := GalgameFacet{Scenario: e.scenario, Illustration: e.illustration}
	for _, t := range e.tags {
		if t.sexual && !sexualOK {
			continue
		}
		f.Tags = append(f.Tags, GalgameCardTag{ID: t.id, Name: t.name})
		if len(f.Tags) == facetTagMax {
			break
		}
	}
	return f
}

func facetFrom(w catalogWork) facetEntry {
	e := facetEntry{tags: facetTags(w.Tags)}
	for _, g := range catalogStaff(w.Credits, nil) {
		switch g.RoleKey {
		case "scenario":
			e.scenario = facetNames(g.People)
		case "illustration":
			e.illustration = facetNames(g.People)
		}
	}
	return e
}

func facetNames(people []GalgameStaffMember) []KunLanguage {
	names := make([]KunLanguage, 0, facetStaffMax)
	for _, p := range people {
		if len(names) == facetStaffMax {
			break
		}
		names = append(names, p.Name)
	}
	return names
}

// The shelf comes out of catalog's own tiering: core is the curated inventory,
// content drops the meta rows ("Galgame", "PC") that say nothing about the
// work, and an unmapped row is a raw folksonomy string — on work 3 those are
// staff names, not tags. Rarest first, because the head of that distribution is
// the same everywhere: 男性主人公 sits on 7,465 works and would lead every card
// in the list, while the tag on 174 is the reason to open this one.
func facetTags(tags []catalogWorkTag) []facetTag {
	picked := make([]catalogWorkTag, 0, len(tags))
	for _, t := range tags {
		if t.CanonicalID <= 0 || t.Tier != "core" || t.Kind != "content" || t.Spoiler > 0 {
			continue
		}
		picked = append(picked, t)
	}
	sort.SliceStable(picked, func(i, j int) bool { return picked[i].Count < picked[j].Count })

	out := make([]facetTag, 0, len(picked))
	for _, t := range picked {
		out = append(out, facetTag{id: int(t.CanonicalID), name: t.Name, sexual: t.Sexual})
	}
	return out
}

package client

import (
	"context"
	"sort"
	"sync"
	"time"
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
	facetTTL         = 6 * time.Hour
	facetMaxEntries  = 20000
	facetConcurrency = 8
	facetStaffMax    = 2
	facetTagMax      = 6
)

type facetTag struct {
	id     int
	name   string
	sexual bool
}

type facetEntry struct {
	scenario     []KunLanguage
	illustration []KunLanguage
	tags         []facetTag
	at           time.Time
}

type facetCache struct {
	mu sync.RWMutex
	m  map[int64]facetEntry
}

func newFacetCache() *facetCache { return &facetCache{m: map[int64]facetEntry{}} }

func (c *facetCache) get(id int64) (facetEntry, bool) {
	c.mu.RLock()
	e, ok := c.m[id]
	c.mu.RUnlock()
	if !ok || time.Since(e.at) > facetTTL {
		return facetEntry{}, false
	}
	return e, true
}

func (c *facetCache) put(id int64, e facetEntry) {
	e.at = time.Now()
	c.mu.Lock()
	defer c.mu.Unlock()
	if len(c.m) >= facetMaxEntries {
		c.m = make(map[int64]facetEntry, facetMaxEntries/4)
	}
	c.m[id] = e
}

// GalgameFacets answers the card facet for each gid it can reach. A facet is
// decoration: a work catalog refuses or fails to answer for is simply absent
// from the map, and the list it was built for still renders.
func (c *Client) GalgameFacets(ctx context.Context, gids []int, contentLimit string) map[int]GalgameFacet {
	out := make(map[int]GalgameFacet, len(gids))
	if c == nil || len(gids) == 0 {
		return out
	}
	byGID, err := c.resolveGIDs(ctx, gids)
	if err != nil || len(byGID) == 0 {
		return out
	}

	entries := make(map[int64]facetEntry, len(byGID))
	var missing []int64
	for _, id := range byGID {
		if _, done := entries[id]; done {
			continue
		}
		if e, ok := c.facets.get(id); ok {
			entries[id] = e
			continue
		}
		entries[id] = facetEntry{}
		missing = append(missing, id)
	}

	if len(missing) > 0 {
		fetched := c.fetchFacets(ctx, missing)
		for id, e := range fetched {
			entries[id] = e
		}
	}

	sexualOK := gateFor(contentLimit).contentLimit != "sfw"
	for gid, id := range byGID {
		if f := entries[id].facet(sexualOK); !f.empty() {
			out[gid] = f
		}
	}
	return out
}

func (c *Client) fetchFacets(ctx context.Context, ids []int64) map[int64]facetEntry {
	out := make(map[int64]facetEntry, len(ids))
	var mu sync.Mutex
	var wg sync.WaitGroup
	sem := make(chan struct{}, facetConcurrency)
	for _, id := range ids {
		wg.Add(1)
		go func(id int64) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			w, err := c.v2.WorkFacets(ctx, id)
			if err != nil {
				return
			}
			e := facetFrom(workToDetail(*w))
			c.facets.put(id, e)
			mu.Lock()
			out[id] = e
			mu.Unlock()
		}(id)
	}
	wg.Wait()
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

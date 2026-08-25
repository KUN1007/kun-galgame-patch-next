package client

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"sync"
	"time"

	"kun-galgame-patch-api/pkg/catalogv2"
)

const catalogCodeNotFound = 4

const catalogCodeMoved = 12

func catalogAbsent(err error) bool {
	return errors.Is(err, catalogv2.ErrNotFound) || IsAbsent(err)
}

const catalogLookupBatchMax = 100

var anchorSourceKeys = []string{"curated", "galgame_wiki"}

func gidLookupStride() int {
	return max(catalogLookupBatchMax/len(anchorSourceKeys), 1)
}

const CatalogWorksIDsMax = 100

const gidMapTTL = time.Hour

const gidMapMaxEntries = 20000

type gidMapEntry struct {
	catalogID int64
	at        time.Time
}

type gidMap struct {
	mu sync.RWMutex
	m  map[int]gidMapEntry
}

func newGIDMap() *gidMap { return &gidMap{m: map[int]gidMapEntry{}} }

func (g *gidMap) get(gid int) (int64, bool) {
	g.mu.RLock()
	e, ok := g.m[gid]
	g.mu.RUnlock()
	if !ok || time.Since(e.at) > gidMapTTL {
		return 0, false
	}
	return e.catalogID, true
}

func (g *gidMap) put(gid int, catalogID int64) {
	g.mu.Lock()
	defer g.mu.Unlock()
	if len(g.m) >= gidMapMaxEntries {
		g.m = make(map[int]gidMapEntry, gidMapMaxEntries/4)
	}
	g.m[gid] = gidMapEntry{catalogID: catalogID, at: time.Now()}
}

type catalogGate struct {
	contentLimit  string
	contentRating string
}

func gateFor(contentLimit string) catalogGate {
	switch strings.ToLower(strings.TrimSpace(contentLimit)) {
	case "sfw":
		return catalogGate{contentLimit: "sfw"}
	case "nsfw":
		return catalogGate{contentLimit: "nsfw"}
	default:
		return catalogGate{}
	}
}

func (g catalogGate) allows(displayLimit string) bool {
	return g.contentLimit == "" || g.contentLimit == displayLimit
}

func (c *Client) resolveGIDs(ctx context.Context, gids []int) (map[int]int64, error) {
	out := make(map[int]int64, len(gids))
	var missing []int
	for _, gid := range gids {
		if gid <= 0 {
			continue
		}
		if id, ok := c.gids.get(gid); ok {
			out[gid] = id
			continue
		}
		missing = append(missing, gid)
	}
	stride := gidLookupStride()
	for start := 0; start < len(missing); start += stride {
		end := min(start+stride, len(missing))
		chunk := missing[start:end]
		refs := make([]catalogv2.Ref, 0, len(chunk)*len(anchorSourceKeys))
		for _, gid := range chunk {
			for _, source := range anchorSourceKeys {
				refs = append(refs, catalogv2.Ref{Source: source, ExternalID: strconv.Itoa(gid)})
			}
		}
		page, err := c.v2.ListWorks(ctx, catalogv2.WorksQuery{
			Refs: refs, NSFW: true, Include: []string{"refs"},
		})
		if err != nil {
			return nil, catalogErr(err)
		}
		wanted := map[int]bool{}
		for _, gid := range chunk {
			wanted[gid] = true
		}
		for i := range page.Items {
			w := page.Items[i]
			id, ok := w.IntID()
			if !ok {
				continue
			}
			if w.Refs != nil {
				for _, r := range *w.Refs {
					gid, conv := strconv.Atoi(r.ExternalID)
					if conv != nil || !wanted[gid] {
						continue
					}
					if r.Source == "curated" || r.Source == "galgame_wiki" {
						out[gid] = id
						c.gids.put(gid, id)
					}
				}
			}
			if claim := claimedFrom(w.Claim); claim != nil && isGIDClaimSite(claim.Site) {
				gid := int(claim.WorkID)
				if wanted[gid] {
					out[gid] = id
					c.gids.put(gid, id)
				}
			}
		}
	}
	var unbridged []int
	for _, gid := range missing {
		if _, ok := out[gid]; !ok {
			unbridged = append(unbridged, gid)
		}
	}
	if len(unbridged) > 0 {
		adopted, err := c.resolveByIdentity(ctx, unbridged)
		if err != nil {
			return nil, err
		}
		for gid, id := range adopted {
			out[gid] = id
		}
	}
	return out, nil
}

func (c *Client) resolveByIdentity(ctx context.Context, gids []int) (map[int]int64, error) {
	out := make(map[int]int64, len(gids))
	for start := 0; start < len(gids); start += CatalogWorksIDsMax {
		end := min(start+CatalogWorksIDsMax, len(gids))
		ids := make([]int64, 0, end-start)
		for _, gid := range gids[start:end] {
			ids = append(ids, int64(gid))
		}
		page, err := c.v2.ListWorks(ctx, catalogv2.WorksQuery{
			IDs: ids, NSFW: true, Limit: CatalogWorksIDsMax,
		})
		if err != nil {
			if catalogAbsent(err) {
				continue
			}
			return nil, catalogErr(err)
		}
		for i := range page.Items {
			it := workToListItem(page.Items[i])
			if !it.ClaimedBy.renderable() {
				continue
			}
			gid := it.publicGID()
			if gid == 0 || int64(gid) != it.ID {
				continue
			}
			out[gid] = it.ID
			c.gids.put(gid, it.ID)
		}
	}
	return out, nil
}

func (c *Client) ClaimStates(ctx context.Context, gids []int) (map[int]string, error) {
	out := make(map[int]string, len(gids))
	byGID, err := c.resolveGIDs(ctx, gids)
	if err != nil {
		return nil, err
	}
	ids := make([]int64, 0, len(byGID))
	rev := map[int64]int{}
	for gid, id := range byGID {
		ids = append(ids, id)
		rev[id] = gid
	}
	if len(ids) == 0 {
		return out, nil
	}
	page, err := c.v2.ListWorks(ctx, catalogv2.WorksQuery{
		IDs: ids, NSFW: true, Limit: CatalogWorksIDsMax,
	})
	if err != nil {
		return nil, catalogErr(err)
	}
	for i := range page.Items {
		it := workToListItem(page.Items[i])
		gid, ok := rev[it.ID]
		if !ok {
			continue
		}
		out[gid] = claimStateOf(it.ClaimedBy)
	}
	return out, nil
}

func (c *Client) resolveGID(ctx context.Context, gid int) (catalogID int64, found bool, err error) {
	if gid <= 0 {
		return 0, false, nil
	}
	if id, ok := c.gids.get(gid); ok {
		return id, true, nil
	}
	for _, source := range anchorSourceKeys {
		id, found, err := c.resolveGIDBySource(ctx, source, gid)
		if err != nil || found {
			return id, found, err
		}
	}
	adopted, err := c.resolveByIdentity(ctx, []int{gid})
	if err != nil {
		return 0, false, err
	}
	if id, ok := adopted[gid]; ok {
		return id, true, nil
	}
	return 0, false, nil
}

func (c *Client) ResolveWorkID(ctx context.Context, gid int) (int64, bool, error) {
	return c.resolveGID(ctx, gid)
}

func (c *Client) resolveGIDBySource(ctx context.Context, source string, gid int) (int64, bool, error) {
	w, err := c.v2.WorkByRef(ctx, source, strconv.Itoa(gid), true)
	if err != nil {
		if catalogAbsent(err) {
			return 0, false, nil
		}
		return 0, false, catalogErr(err)
	}
	id, ok := w.IntID()
	if !ok {
		return 0, false, nil
	}
	c.gids.put(gid, id)
	return id, true, nil
}

func (c *Client) ResolveWikiLabel(ctx context.Context, oid int) (int64, bool, error) {
	if oid <= 0 {
		return 0, false, nil
	}
	for _, source := range anchorSourceKeys {
		id, err := c.v2.EntityByRef(ctx, "company", source, strconv.Itoa(oid), true)
		if err != nil {
			if catalogAbsent(err) {
				continue
			}
			return 0, false, catalogErr(err)
		}
		if id > 0 {
			return id, true, nil
		}
	}
	return 0, false, nil
}

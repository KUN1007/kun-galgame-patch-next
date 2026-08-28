package client

import (
	"context"
	"fmt"
	"slices"
	"strconv"

	"kun-galgame-patch-api/pkg/catalogv2"
)

// DisplayVerdict is one catalog work's display axis, already keyed by the id
// moyu's patch table uses.
type DisplayVerdict struct {
	GID          int
	ContentLimit string
}

// DisplayVerdictsByCatalogIDs hydrates ids taken from the catalog changes feed.
//
// Both gates are open on purpose — nsfw=true and no content_limit. Sending the
// reader's gate here would hide exactly the works this is meant to mark nsfw,
// and they would stay NULL and keep passing the list predicate forever.
func (c *Client) DisplayVerdictsByCatalogIDs(ctx context.Context, ids []int64) ([]DisplayVerdict, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	if len(ids) > CatalogWorksIDsMax {
		return nil, fmt.Errorf(
			"DisplayVerdictsByCatalogIDs: %d ids exceeds the %d-id ceiling — chunk by client.CatalogWorksIDsMax",
			len(ids), CatalogWorksIDsMax,
		)
	}
	page, err := c.v2.ListWorks(ctx, catalogv2.WorksQuery{
		IDs: ids, NSFW: true, Include: []string{"refs"}, Limit: CatalogWorksIDsMax,
	})
	if err != nil {
		return nil, catalogErr(err)
	}
	out := make([]DisplayVerdict, 0, len(page.Items))
	for i := range page.Items {
		it := workToListItem(page.Items[i])
		gid := mirrorGID(&it)
		if gid == 0 {
			continue
		}
		cl, _ := contentAxisOf(it.ClaimedBy, it.ContentRating)
		out = append(out, DisplayVerdict{GID: gid, ContentLimit: cl})
	}
	return out, nil
}

// The anchor only, never publicGID's fallback. That fallback answers the
// catalog id for a work carrying no claim, and it is safe on the read path
// because the ids there came out of a ref lookup in the first place. The
// changes feed hands over catalog ids directly, so an unclaimed work would be
// filed under a patch id belonging to a different game — the two id spaces
// overlap and only 9% of moyu's own rows have equal values.
func mirrorGID(it *catalogWorkListItem) int {
	if gid := it.ClaimedBy.gid(); gid > 0 {
		return gid
	}
	return anchorGIDOf(it.Refs)
}

func anchorGIDOf(refs []catalogRef) int {
	for _, r := range refs {
		if !slices.Contains(anchorSourceKeys, r.Source) {
			continue
		}
		if gid, err := strconv.Atoi(r.ExternalID); err == nil && gid > 0 {
			return gid
		}
	}
	return 0
}

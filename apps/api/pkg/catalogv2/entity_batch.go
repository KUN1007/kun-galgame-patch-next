package catalogv2

import (
	"context"
	"net/url"
	"strconv"
	"strings"
)

// The batch lanes below answer the half of an entity card that /v2/catalog/search
// does not: a picture and a work count. The search face is a name index — it
// answers ids and names and nothing else — so a card that wants either has to
// come back for it by id.

func (c *Client) CharactersByIDs(ctx context.Context, ids []int64, nsfw bool) ([]Character, error) {
	// Without include=image the row comes back with no picture at all: image is
	// an include token on every lane, not a default field.
	return batchByIDs[Character](ctx, c, "/v2/catalog/characters", ids, []string{"image"}, nsfw)
}

func (c *Client) CompaniesByIDs(ctx context.Context, ids []int64, nsfw bool) ([]Company, error) {
	return batchByIDs[Company](ctx, c, "/v2/catalog/companies", ids, []string{"logo"}, nsfw)
}

func (c *Client) TagsByIDs(ctx context.Context, ids []int64, nsfw bool) ([]Tag, error) {
	return batchByIDs[Tag](ctx, c, "/v2/catalog/tags", ids, nil, nsfw)
}

func (c *Client) SeriesByIDs(ctx context.Context, ids []int64, nsfw bool) ([]Series, error) {
	return batchByIDs[Series](ctx, c, "/v2/catalog/series", ids, nil, nsfw)
}

func batchByIDs[T any](
	ctx context.Context, c *Client, path string, ids []int64, include []string, nsfw bool,
) ([]T, error) {
	if len(ids) == 0 {
		return []T{}, nil
	}
	if len(ids) > batchIDsLimit {
		ids = ids[:batchIDsLimit]
	}
	v := url.Values{}
	v.Set("ids", joinIDs(ids))
	v.Set("limit", strconv.Itoa(batchIDsLimit))
	if len(include) > 0 {
		v.Set("include", strings.Join(include, ","))
	}
	if nsfw {
		v.Set("nsfw", "true")
	} else {
		v.Set("nsfw", "false")
	}
	var out List[T]
	if err := c.get(ctx, path+"?"+v.Encode(), &out); err != nil {
		return nil, err
	}
	return out.Items, nil
}

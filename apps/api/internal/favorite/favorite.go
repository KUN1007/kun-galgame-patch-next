// Package favorite answers "which games has this person favourited" out of the
// catalog folders that have owned that answer since the 2026-09-07 cutover.
//
// It exists because five surfaces went on reading user_patch_favorite_relation
// after the cutover froze it. Nothing writes that table any more, so the
// profile counter stopped moving the day the new binary deployed: user 121089
// was shown "10 收藏" over an empty list, and the calendar and the resource page
// drew their hearts from the same snapshot.
package favorite

import (
	"context"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	"kun-galgame-patch-api/pkg/catalogv2"
)

// WorkIDs is every catalog work in the folders this reader may see, in folder
// order and deduplicated — a game filed in two folders is one favourite.
//
// The visibility rule is the catalog's own: /v2/me/folders answers private
// folders and only to their owner, /v2/folders answers the public ones to
// anybody. So a person reading their own shelf sees all of it and a visitor
// sees what the owner published. Every caller must therefore reach here with
// the reader's token, which is what the /user/:id/favorite route was missing.
func WorkIDs(ctx context.Context, gal *galgameClient.Client, ownerUID int, token string, isOwner bool) ([]int64, error) {
	if gal == nil {
		return nil, nil
	}
	v2 := gal.V2()
	own := isOwner && token != ""

	var (
		folders []catalogv2.Folder
		err     error
	)
	if own {
		folders, err = v2.MyFolders(ctx, token)
	} else {
		folders, err = v2.PublicFolders(ctx, int64(ownerUID))
	}
	if err != nil {
		return nil, err
	}

	seen := map[int64]bool{}
	out := []int64{}
	for _, f := range folders {
		if f.ItemCount == 0 {
			continue
		}
		var items []catalogv2.FolderItem
		if own {
			items, err = v2.MyFolderItems(ctx, token, f.ID)
		} else {
			items, err = v2.PublicFolderItems(ctx, f.ID)
		}
		if err != nil {
			return nil, err
		}
		for _, it := range items {
			if seen[it.WorkID] {
				continue
			}
			seen[it.WorkID] = true
			out = append(out, it.WorkID)
		}
	}
	return out, nil
}

// Holds is the heart button for one game. The catalog answers the membership
// question directly, so this is one request rather than a walk of every folder
// the person owns.
func Holds(ctx context.Context, gal *galgameClient.Client, token string, workID int64) (bool, error) {
	if gal == nil || token == "" || workID <= 0 {
		return false, nil
	}
	holding, err := gal.V2().MyFoldersHolding(ctx, token, workID)
	if err != nil {
		return false, err
	}
	return len(holding) > 0, nil
}

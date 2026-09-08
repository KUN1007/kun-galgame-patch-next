package utils

import "gorm.io/gorm"

// PatchWorkOrder is which page should represent a work when more than one patch
// names it: published, then the one that actually carries patches, then a real
// page over a stub, then the older id.
const PatchWorkOrder = "published DESC, resource_count DESC, is_stub ASC, id ASC"

type patchWorkRow struct {
	ID            int
	CatalogWorkID int64
}

// PatchIDsByWorkIDs turns catalog work ids back into the patch that represents
// each one.
//
// A work can be named by more than one patch. This site dedupes on the vndb_id
// STRING, so a game that reaches it once as `wiki-<n>` and once as `v<n>` gets
// two pages — production has two such pairs, and the unique index that first
// shipped on patch.catalog_work_id died on one of them (migration 034). The
// catalog files the favourite against the work, so a heart on either page is
// the same favourite; only the rendering has to choose, and without the ORDER
// BY the row it chose was whichever one the planner happened to return last.
func PatchIDsByWorkIDs(db *gorm.DB, workIDs []int64) (map[int64]int, error) {
	if len(workIDs) == 0 {
		return map[int64]int{}, nil
	}
	var rows []patchWorkRow
	if err := db.Table("patch").Select("id, catalog_work_id").
		Where("catalog_work_id IN ?", workIDs).
		Order(PatchWorkOrder).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return firstPerWork(rows), nil
}

func firstPerWork(rows []patchWorkRow) map[int64]int {
	out := make(map[int64]int, len(rows))
	for _, row := range rows {
		if _, taken := out[row.CatalogWorkID]; !taken {
			out[row.CatalogWorkID] = row.ID
		}
	}
	return out
}

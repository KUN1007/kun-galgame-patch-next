package repository

import (
	"errors"

	"kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/pkg/utils"
)

// A `pending-<n>` placeholder has no vndb number and therefore no work. Its
// favourites cannot travel to the catalog, and answering 0 would file them on
// nothing, so the refusal is explicit.
var ErrNoCatalogWork = errors.New("patch has no catalog work")

// A folder item names a catalog WORK, and this site's patch.id is a different
// id space (migration 034). Both directions are a local index lookup on
// patch.catalog_work_id so a heart click costs no extra catalog call and
// rendering "my favourites" stays one SQL query.

func (r *PatchRepository) CatalogWorkID(patchID int) (int64, error) {
	var row model.Patch
	if err := r.db.Select("catalog_work_id").Where("id = ?", patchID).First(&row).Error; err != nil {
		return 0, err
	}
	if row.CatalogWorkID == nil {
		return 0, ErrNoCatalogWork
	}
	return *row.CatalogWorkID, nil
}

func (r *PatchRepository) PatchIDsByWorkIDs(workIDs []int64) (map[int64]int, error) {
	return utils.PatchIDsByWorkIDs(r.db, workIDs)
}

func (r *PatchRepository) SetCatalogWorkID(patchID int, workID int64) error {
	return r.db.Model(&model.Patch{}).Where("id = ?", patchID).
		Update("catalog_work_id", workID).Error
}

// PatchesByIDsOrdered keeps the order the caller asked for. The folder decides
// the order — newest added first — and an `IN (?)` would hand back whatever
// the planner felt like.
func (r *PatchRepository) PatchesByIDsOrdered(ids []int) ([]model.Patch, error) {
	out := []model.Patch{}
	if len(ids) == 0 {
		return out, nil
	}
	var rows []model.Patch
	if err := r.db.Where("id IN ?", ids).Find(&rows).Error; err != nil {
		return nil, err
	}
	byID := make(map[int]model.Patch, len(rows))
	for _, row := range rows {
		byID[row.ID] = row
	}
	for _, id := range ids {
		if row, ok := byID[id]; ok {
			out = append(out, row)
		}
	}
	return out, nil
}

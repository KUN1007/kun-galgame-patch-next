package repository

import (
	"fmt"
	"strings"

	patchModel "kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/pkg/utils"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *Repository { return &Repository{db: db} }

// PatchFilter is the parsed query. Every field is already validated against a
// closed vocabulary by the service, so nothing here escapes a value: the jsonb
// predicates below interpolate into a literal, where an unvetted string is a
// Postgres syntax error the caller sees as a 500 rather than a filter.
type PatchFilter struct {
	IDs      []int
	VndbIDs  []string
	WorkIDs  []int64
	Batch    bool
	Types    []string
	Language []string
	Platform []string
	// ContentLimit is "" for both gates open. A named gate keeps the rows
	// catalog has not been mirrored for yet, which is the same call the site's
	// own list makes: a stale NULL costs a short page, never an nsfw leak.
	ContentLimit string
	HasResources *bool
	Sort         string
	Offset       int
	Limit        int
}

var sortOrders = map[string]string{
	"updated":   "resource_update_time DESC, id DESC",
	"created":   "created DESC, id DESC",
	"downloads": "download DESC, id DESC",
	"views":     "view DESC, id DESC",
}

// SortKeys is the collection's declared sort vocabulary, in the order the
// documentation lists them.
var SortKeys = []string{"updated", "created", "downloads", "views"}

func (r *Repository) patchQuery(f PatchFilter) *gorm.DB {
	q := r.db.Model(&patchModel.Patch{}).Where("patch.status = 0")

	if f.Batch {
		q = q.Where(r.batchScope(f))
	}
	if len(f.Types) > 0 {
		q = jsonArrayAny(q, "type", f.Types)
	}
	if len(f.Language) > 0 {
		q = jsonArrayAny(q, "language", f.Language)
	}
	if len(f.Platform) > 0 {
		q = jsonArrayAny(q, "platform", f.Platform)
	}
	q = utils.ScopePatchContentLimit(q, f.ContentLimit)
	if f.HasResources != nil {
		if *f.HasResources {
			q = q.Where("resource_count > 0")
		} else {
			q = q.Where("resource_count = 0")
		}
	}
	return q
}

// batchScope ORs the three anchors a caller may arrive by. They are separate
// id spaces -- a patch id, this site's vndb key and a catalog work id are three
// different numbers for the same game -- so they can only be matched column by
// column, never folded into one IN list.
func (r *Repository) batchScope(f PatchFilter) *gorm.DB {
	scope := r.db.Where("1 = 0")
	if len(f.IDs) > 0 {
		scope = scope.Or("patch.id IN ?", f.IDs)
	}
	if len(f.VndbIDs) > 0 {
		scope = scope.Or("patch.vndb_id IN ?", f.VndbIDs)
	}
	if len(f.WorkIDs) > 0 {
		scope = scope.Or("patch.catalog_work_id IN ?", f.WorkIDs)
	}
	return scope
}

func (r *Repository) ListPatches(f PatchFilter) ([]patchModel.Patch, error) {
	order := sortOrders[f.Sort]
	if f.Batch {
		// A batch answer is a set, not a page, and a work can be named by two
		// pages. Ordering it the way the site picks a work's representative
		// puts the page a reader should land on first, so a caller taking
		// items[0] gets the same one the site would show.
		order = utils.PatchWorkOrder
	}
	if order == "" {
		order = sortOrders["updated"]
	}
	q := r.patchQuery(f).Order(order).Limit(f.Limit)
	if !f.Batch {
		q = q.Offset(f.Offset)
	}
	var rows []patchModel.Patch
	if err := q.Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *Repository) CountPatches(f PatchFilter) (int64, error) {
	var n int64
	err := r.patchQuery(f).Count(&n).Error
	return n, err
}

func (r *Repository) GetPatch(id int) (*patchModel.Patch, error) {
	var row patchModel.Patch
	err := r.db.Where("id = ? AND status = 0", id).First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

// resourceQuery only ever sees live rows. status 1 is a resource its publisher
// disabled and status 2 one moderation hid; both are 404 on every public
// surface of the site, and this face is one.
func (r *Repository) resourceQuery(patchIDs []int) *gorm.DB {
	q := r.db.Model(&patchModel.PatchResource{}).Where("status = 0")
	if len(patchIDs) > 0 {
		q = q.Where("galgame_id IN ?", patchIDs)
	}
	return q
}

func (r *Repository) ListResources(patchID, offset, limit int) ([]patchModel.PatchResource, error) {
	var rows []patchModel.PatchResource
	err := r.resourceQuery([]int{patchID}).
		Order("update_time DESC, id DESC").
		Offset(offset).Limit(limit).Find(&rows).Error
	return rows, err
}

func (r *Repository) CountResources(patchID int) (int64, error) {
	var n int64
	err := r.resourceQuery([]int{patchID}).Count(&n).Error
	return n, err
}

// ResourcesForPatches is the include=resources lane: one query for the whole
// page rather than one per row.
func (r *Repository) ResourcesForPatches(patchIDs []int) ([]patchModel.PatchResource, error) {
	if len(patchIDs) == 0 {
		return nil, nil
	}
	var rows []patchModel.PatchResource
	err := r.resourceQuery(patchIDs).
		Order("galgame_id ASC, update_time DESC, id DESC").
		Find(&rows).Error
	return rows, err
}

func (r *Repository) GetResource(id int) (*patchModel.PatchResource, error) {
	var row patchModel.PatchResource
	err := r.resourceQuery(nil).Where("id = ?", id).First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

// jsonArrayAny ORs the values: asking for two languages asks for either, not
// for a page whose resources cover both.
func jsonArrayAny(q *gorm.DB, column string, values []string) *gorm.DB {
	clauses := make([]string, 0, len(values))
	args := make([]any, 0, len(values))
	for _, value := range values {
		clauses = append(clauses, column+" @> ?")
		args = append(args, fmt.Sprintf(`["%s"]`, value))
	}
	return q.Where(strings.Join(clauses, " OR "), args...)
}

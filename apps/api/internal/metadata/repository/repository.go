package repository

import (
	"fmt"

	metaModel "kun-galgame-patch-api/internal/metadata/model"
	patchModel "kun-galgame-patch-api/internal/patch/model"

	"gorm.io/gorm"
)

type MetadataRepository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *MetadataRepository {
	return &MetadataRepository{db: db}
}

// ===== Tags =====

func (r *MetadataRepository) GetTags(offset, limit int) ([]patchModel.PatchTag, int64, error) {
	var tags []patchModel.PatchTag
	var total int64
	r.db.Model(&patchModel.PatchTag{}).Count(&total)
	err := r.db.Order("count DESC").Offset(offset).Limit(limit).Find(&tags).Error
	return tags, total, err
}

func (r *MetadataRepository) GetTagByID(id int) (*patchModel.PatchTag, error) {
	var tag patchModel.PatchTag
	err := r.db.First(&tag, id).Error
	return &tag, err
}

func (r *MetadataRepository) CreateTag(tag *patchModel.PatchTag) error {
	return r.db.Create(tag).Error
}

func (r *MetadataRepository) FindTagByName(name string) (*patchModel.PatchTag, error) {
	var tag patchModel.PatchTag
	err := r.db.Where("name = ?", name).First(&tag).Error
	return &tag, err
}

func (r *MetadataRepository) GetPatchesByTag(tagID, offset, limit int, nsfwFilter string) ([]patchModel.Patch, int64, error) {
	var patches []patchModel.Patch
	var total int64

	sub := r.db.Table("patch_tag_relation").Where("tag_id = ?", tagID).Select("patch_id")
	query := r.db.Model(&patchModel.Patch{}).Where("id IN (?)", sub)
	if nsfwFilter != "" {
		query = query.Where("content_limit = ?", nsfwFilter)
	}
	query.Count(&total)

	err := query.Order("created DESC").Offset(offset).Limit(limit).Find(&patches).Error
	return patches, total, err
}

func (r *MetadataRepository) SearchTags(queries []string) ([]patchModel.PatchTag, error) {
	var tags []patchModel.PatchTag
	query := r.db.Model(&patchModel.PatchTag{})

	for _, q := range queries {
		like := fmt.Sprintf("%%%s%%", q)
		query = query.Where("name ILIKE ? OR name_en_us ILIKE ? OR alias::text ILIKE ?", like, like, like)
	}

	err := query.Limit(100).Find(&tags).Error
	return tags, err
}

// ===== Characters =====

func (r *MetadataRepository) GetCharacters(offset, limit int) ([]metaModel.PatchChar, int64, error) {
	var chars []metaModel.PatchChar
	var total int64
	r.db.Model(&metaModel.PatchChar{}).Count(&total)
	err := r.db.Order("id DESC").Offset(offset).Limit(limit).Find(&chars).Error
	return chars, total, err
}

func (r *MetadataRepository) GetCharByID(id int) (*metaModel.PatchChar, error) {
	var ch metaModel.PatchChar
	err := r.db.Preload("Aliases").First(&ch, id).Error
	return &ch, err
}

func (r *MetadataRepository) SearchCharacters(queries []string) ([]metaModel.PatchChar, error) {
	var chars []metaModel.PatchChar
	query := r.db.Model(&metaModel.PatchChar{})

	for _, q := range queries {
		like := fmt.Sprintf("%%%s%%", q)
		query = query.Where("name_zh_cn ILIKE ? OR name_ja_jp ILIKE ? OR name_en_us ILIKE ?", like, like, like)
	}

	err := query.Limit(100).Find(&chars).Error
	return chars, err
}

// ===== Companies =====

func (r *MetadataRepository) GetCompanies(offset, limit int) ([]metaModel.PatchCompany, int64, error) {
	var companies []metaModel.PatchCompany
	var total int64
	r.db.Model(&metaModel.PatchCompany{}).Count(&total)
	err := r.db.Order("count DESC").Offset(offset).Limit(limit).Find(&companies).Error
	return companies, total, err
}

func (r *MetadataRepository) GetCompanyByID(id int) (*metaModel.PatchCompany, error) {
	var company metaModel.PatchCompany
	err := r.db.First(&company, id).Error
	return &company, err
}

func (r *MetadataRepository) CreateCompany(company *metaModel.PatchCompany) error {
	return r.db.Create(company).Error
}

func (r *MetadataRepository) FindCompanyByName(name string) (*metaModel.PatchCompany, error) {
	var company metaModel.PatchCompany
	err := r.db.Where("name = ?", name).First(&company).Error
	return &company, err
}

func (r *MetadataRepository) GetPatchesByCompany(companyID, offset, limit int, nsfwFilter string) ([]patchModel.Patch, int64, error) {
	var patches []patchModel.Patch
	var total int64

	sub := r.db.Table("patch_company_relation").Where("company_id = ?", companyID).Select("patch_id")
	query := r.db.Model(&patchModel.Patch{}).Where("id IN (?)", sub)
	if nsfwFilter != "" {
		query = query.Where("content_limit = ?", nsfwFilter)
	}
	query.Count(&total)

	err := query.Order("created DESC").Offset(offset).Limit(limit).Find(&patches).Error
	return patches, total, err
}

func (r *MetadataRepository) SearchCompanies(queries []string) ([]metaModel.PatchCompany, error) {
	var companies []metaModel.PatchCompany
	query := r.db.Model(&metaModel.PatchCompany{})

	for _, q := range queries {
		like := fmt.Sprintf("%%%s%%", q)
		query = query.Where("name ILIKE ? OR alias::text ILIKE ?", like, like)
	}

	err := query.Limit(100).Find(&companies).Error
	return companies, err
}

// ===== Persons =====

func (r *MetadataRepository) GetPersons(offset, limit int) ([]metaModel.PatchPerson, int64, error) {
	var persons []metaModel.PatchPerson
	var total int64
	r.db.Model(&metaModel.PatchPerson{}).Count(&total)
	err := r.db.Order("id DESC").Offset(offset).Limit(limit).Find(&persons).Error
	return persons, total, err
}

func (r *MetadataRepository) GetPersonByID(id int) (*metaModel.PatchPerson, error) {
	var person metaModel.PatchPerson
	err := r.db.Preload("Aliases").First(&person, id).Error
	return &person, err
}

func (r *MetadataRepository) SearchPersons(queries []string) ([]metaModel.PatchPerson, error) {
	var persons []metaModel.PatchPerson
	query := r.db.Model(&metaModel.PatchPerson{})

	for _, q := range queries {
		like := fmt.Sprintf("%%%s%%", q)
		query = query.Where("name_zh_cn ILIKE ? OR name_ja_jp ILIKE ? OR name_en_us ILIKE ?", like, like, like)
	}

	err := query.Limit(100).Find(&persons).Error
	return persons, err
}

// ===== Releases =====

func (r *MetadataRepository) GetReleasesByMonth(year, month int) ([]metaModel.PatchRelease, error) {
	var releases []metaModel.PatchRelease
	prefix := fmt.Sprintf("%04d-%02d", year, month)
	err := r.db.Where("released LIKE ?", prefix+"%").
		Order("released ASC").Find(&releases).Error
	return releases, err
}

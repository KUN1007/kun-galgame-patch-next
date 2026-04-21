package service

import (
	"encoding/json"
	"fmt"

	metaModel "kun-galgame-patch-api/internal/metadata/model"
	"kun-galgame-patch-api/internal/metadata/repository"
	patchModel "kun-galgame-patch-api/internal/patch/model"
)

type MetadataService struct {
	repo *repository.MetadataRepository
}

func New(repo *repository.MetadataRepository) *MetadataService {
	return &MetadataService{repo: repo}
}

// ===== Tags =====

func (s *MetadataService) GetTags(page, limit int) ([]patchModel.PatchTag, int64, error) {
	return s.repo.GetTags((page-1)*limit, limit)
}

func (s *MetadataService) GetTagByID(id int) (*patchModel.PatchTag, error) {
	return s.repo.GetTagByID(id)
}

func (s *MetadataService) CreateTag(name, introduction string, alias []string) (*patchModel.PatchTag, error) {
	if existing, _ := s.repo.FindTagByName(name); existing != nil {
		return nil, fmt.Errorf("tag already exists")
	}

	aliasJSON, _ := json.Marshal(alias)
	tag := &patchModel.PatchTag{
		Name:  name,
		Alias: patchModel.JSONArray{},
	}
	json.Unmarshal(aliasJSON, &tag.Alias)

	if introduction != "" {
		tag.IntroductionZhCn = introduction
	}

	if err := s.repo.CreateTag(tag); err != nil {
		return nil, err
	}
	return tag, nil
}

func (s *MetadataService) GetPatchesByTag(tagID, page, limit int, nsfwFilter string) ([]patchModel.Patch, int64, error) {
	return s.repo.GetPatchesByTag(tagID, (page-1)*limit, limit, nsfwFilter)
}

func (s *MetadataService) SearchTags(queries []string) ([]patchModel.PatchTag, error) {
	return s.repo.SearchTags(queries)
}

// ===== Companies =====

func (s *MetadataService) GetCompanies(page, limit int) ([]metaModel.PatchCompany, int64, error) {
	return s.repo.GetCompanies((page-1)*limit, limit)
}

func (s *MetadataService) GetCompanyByID(id int) (*metaModel.PatchCompany, error) {
	return s.repo.GetCompanyByID(id)
}

func (s *MetadataService) CreateCompany(name, introduction string, alias, primaryLang, website, brand []string) (*metaModel.PatchCompany, error) {
	if existing, _ := s.repo.FindCompanyByName(name); existing != nil {
		return nil, fmt.Errorf("company already exists")
	}

	company := &metaModel.PatchCompany{
		Name:            name,
		IntroductionZhCn: introduction,
		Alias:           patchModel.JSONArray(alias),
		PrimaryLanguage: patchModel.JSONArray(primaryLang),
		OfficialWebsite: patchModel.JSONArray(website),
		ParentBrand:     patchModel.JSONArray(brand),
	}

	if err := s.repo.CreateCompany(company); err != nil {
		return nil, err
	}
	return company, nil
}

func (s *MetadataService) GetPatchesByCompany(companyID, page, limit int, nsfwFilter string) ([]patchModel.Patch, int64, error) {
	return s.repo.GetPatchesByCompany(companyID, (page-1)*limit, limit, nsfwFilter)
}

func (s *MetadataService) SearchCompanies(queries []string) ([]metaModel.PatchCompany, error) {
	return s.repo.SearchCompanies(queries)
}


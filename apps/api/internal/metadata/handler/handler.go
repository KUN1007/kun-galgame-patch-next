package handler

import (
	"encoding/json"
	"strconv"

	"kun-galgame-patch-api/internal/metadata/dto"
	"kun-galgame-patch-api/internal/metadata/service"
	"kun-galgame-patch-api/internal/middleware"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

type MetadataHandler struct {
	service *service.MetadataService
}

func New(svc *service.MetadataService) *MetadataHandler {
	return &MetadataHandler{service: svc}
}

func getIDParam(c *fiber.Ctx, name string) (int, error) {
	id, err := strconv.Atoi(c.Params(name))
	if err != nil || id < 1 {
		return 0, errors.ErrBadRequest("invalid ID")
	}
	return id, nil
}

// getNSFWFilter extracts the NSFW filter from the request header
func getNSFWFilter(c *fiber.Ctx) string {
	nsfw := c.Get("x-nsfw-header", "{}")
	var opt struct {
		ShowNSFW bool `json:"showNSFW"`
	}
	json.Unmarshal([]byte(nsfw), &opt)
	if !opt.ShowNSFW {
		return "sfw"
	}
	return ""
}

// ===== Tags =====

// GetTags GET /api/tag
func (h *MetadataHandler) GetTags(c *fiber.Ctx) error {
	var req dto.GetTagRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	tags, total, err := h.service.GetTags(req.Page, req.Limit)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, tags, total)
}

// GetTagByID GET /api/tag/:id
func (h *MetadataHandler) GetTagByID(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	tag, err := h.service.GetTagByID(id)
	if err != nil {
		return response.Error(c, errors.ErrNotFound("tag not found"))
	}
	return response.OK(c, tag)
}

// CreateTag POST /api/tag
func (h *MetadataHandler) CreateTag(c *fiber.Ctx) error {
	var req dto.CreateTagRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	_ = middleware.MustGetUser(c) // require auth

	tag, err := h.service.CreateTag(req.Name, req.Introduction, req.Alias)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OK(c, tag)
}

// GetPatchesByTag GET /api/tag/:id/patch
func (h *MetadataHandler) GetPatchesByTag(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.GetPatchByTagRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	patches, total, err := h.service.GetPatchesByTag(id, req.Page, req.Limit, getNSFWFilter(c))
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, patches, total)
}

// SearchTags POST /api/tag/search
func (h *MetadataHandler) SearchTags(c *fiber.Ctx) error {
	var req dto.SearchRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	tags, err := h.service.SearchTags(req.Query)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.OK(c, tags)
}

// ===== Characters =====

// GetCharacters GET /api/character
func (h *MetadataHandler) GetCharacters(c *fiber.Ctx) error {
	var req dto.GetMetadataRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	chars, total, err := h.service.GetCharacters(req.Page, req.Limit)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, chars, total)
}

// GetCharByID GET /api/character/:id
func (h *MetadataHandler) GetCharByID(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	ch, err := h.service.GetCharByID(id)
	if err != nil {
		return response.Error(c, errors.ErrNotFound("character not found"))
	}
	return response.OK(c, ch)
}

// SearchCharacters POST /api/character/search
func (h *MetadataHandler) SearchCharacters(c *fiber.Ctx) error {
	var req dto.SearchRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	chars, err := h.service.SearchCharacters(req.Query)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.OK(c, chars)
}

// ===== Companies =====

// GetCompanies GET /api/company
func (h *MetadataHandler) GetCompanies(c *fiber.Ctx) error {
	var req dto.GetMetadataRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	companies, total, err := h.service.GetCompanies(req.Page, req.Limit)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, companies, total)
}

// GetCompanyByID GET /api/company/:id
func (h *MetadataHandler) GetCompanyByID(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	company, err := h.service.GetCompanyByID(id)
	if err != nil {
		return response.Error(c, errors.ErrNotFound("company not found"))
	}
	return response.OK(c, company)
}

// CreateCompany POST /api/company
func (h *MetadataHandler) CreateCompany(c *fiber.Ctx) error {
	var req dto.CreateCompanyRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	_ = middleware.MustGetUser(c)

	company, err := h.service.CreateCompany(req.Name, req.Introduction, req.Alias, req.PrimaryLanguage, req.OfficialWebsite, req.ParentBrand)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OK(c, company)
}

// GetPatchesByCompany GET /api/company/:id/patch
func (h *MetadataHandler) GetPatchesByCompany(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.GetPatchByTagRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	patches, total, err := h.service.GetPatchesByCompany(id, req.Page, req.Limit, getNSFWFilter(c))
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, patches, total)
}

// SearchCompanies POST /api/company/search
func (h *MetadataHandler) SearchCompanies(c *fiber.Ctx) error {
	var req dto.SearchRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	companies, err := h.service.SearchCompanies(req.Query)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.OK(c, companies)
}

// ===== Persons =====

// GetPersons GET /api/person
func (h *MetadataHandler) GetPersons(c *fiber.Ctx) error {
	var req dto.GetMetadataRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	persons, total, err := h.service.GetPersons(req.Page, req.Limit)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, persons, total)
}

// GetPersonByID GET /api/person/:id
func (h *MetadataHandler) GetPersonByID(c *fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	person, err := h.service.GetPersonByID(id)
	if err != nil {
		return response.Error(c, errors.ErrNotFound("person not found"))
	}
	return response.OK(c, person)
}

// SearchPersons POST /api/person/search
func (h *MetadataHandler) SearchPersons(c *fiber.Ctx) error {
	var req dto.SearchRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	persons, err := h.service.SearchPersons(req.Query)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.OK(c, persons)
}

// ===== Releases =====

// GetReleases GET /api/release
func (h *MetadataHandler) GetReleases(c *fiber.Ctx) error {
	var req dto.GetReleaseRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	releases, err := h.service.GetReleasesByMonth(req.Year, req.Month)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.OK(c, releases)
}

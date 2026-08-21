package handler

import (
	stderrors "errors"
	"log/slog"
	"net/http"
	"slices"

	"kun-galgame-patch-api/pkg/catalogclient"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"

	"github.com/gofiber/fiber/v3"
)

// The catalog edit schema registers far more than these four (covers,
// screenshots, credits, the `.suppressed` companions …). Widening moyu's edit
// surface is a product decision, so the exposed set is this list and nothing
// else — it filters what the bootstrap hands the page, and the named request
// below is what keeps anything else out of the patch.
var catalogEditFieldKeys = []string{
	fieldWorkDisplayName,
	fieldWorkOLang,
	fieldWorkContentRating,
	fieldWorkTitles,
}

const catalogEditNoteMax = 2000

type catalogEditTitle struct {
	Lang  string `json:"lang"`
	Title string `json:"title"`
	Latin string `json:"latin"`
	Kind  int16  `json:"kind"`
}

type catalogEditValues struct {
	DisplayName   string             `json:"display_name"`
	OLang         string             `json:"olang"`
	ContentRating int16              `json:"content_rating"`
	Titles        []catalogEditTitle `json:"titles"`
}

type catalogEditRequest struct {
	DisplayName   *string             `json:"display_name"`
	OLang         *string             `json:"olang"`
	ContentRating *int16              `json:"content_rating"`
	Titles        *[]catalogEditTitle `json:"titles"`
	Note          string              `json:"note"`
}

func catalogEditErr(c fiber.Ctx, err error) error {
	switch {
	case stderrors.Is(err, catalogclient.ErrNotConfigured):
		return response.Error(c, errors.ErrCatalogUnavailable(""))
	case stderrors.Is(err, catalogclient.ErrInsufficientScope):
		return response.Error(c, errors.ErrCatalogReauthRequired(""))
	case stderrors.Is(err, catalogclient.ErrNoAccessToken):
		return response.Error(c, errors.ErrUnauthorized())
	}

	var apiErr *catalogclient.APIError
	if stderrors.As(err, &apiErr) {
		switch apiErr.Status {
		case http.StatusUnauthorized:
			slog.Warn("catalog edit: upstream rejected the user token",
				"code", apiErr.Code, "message", apiErr.Message)
			return response.Error(c, errors.ErrCatalogReauthRequired(
				"资料库拒绝了当前登录凭证，请退出登录后重新登录一次"))
		case http.StatusForbidden:
			return response.Error(c, errors.New(40300,
				"你没有权限修改该条目（编辑资料需要相应的社区权限）", fiber.StatusForbidden))
		case http.StatusNotFound:
			return response.Error(c, errors.ErrNotFound("资料库中没有这个条目"))
		case http.StatusUnprocessableEntity:
			return response.Error(c, errors.ErrValidation(apiErr.Message))
		case http.StatusConflict:
			return response.Error(c, errors.ErrConflict(
				"条目已被他人修改，或该提案已经关闭，请刷新后重试"))
		case http.StatusTooManyRequests:
			return response.Error(c, errors.ErrTooManyRequests(apiErr.Message))
		}
		slog.Error("catalog edit: upstream error",
			"status", apiErr.Status, "code", apiErr.Code, "message", apiErr.Message)
		return response.Error(c, errors.ErrCatalogUnavailable(""))
	}

	slog.Warn("catalog edit: unreachable", "error", err)
	return response.Error(c, errors.ErrCatalogUnavailable(""))
}

func (h *PatchHandler) catalogEditContext(c fiber.Ctx) (int64, string, error) {
	if h.catalog == nil || !h.catalog.Configured() {
		return 0, "", response.Error(c, errors.ErrCatalogUnavailable(""))
	}
	id, idErr := getIDParam(c, "id")
	if idErr != nil {
		return 0, "", response.Error(c, idErr.(*errors.AppError))
	}
	workID, hErr := h.resolveWorkID(c, id)
	if hErr != nil {
		return 0, "", hErr
	}
	token, tErr := catalogUserToken(c)
	if tErr != nil {
		return 0, "", response.Error(c, tErr)
	}
	return workID, token, nil
}

func catalogEditSnapshotValues(values map[string]any) catalogEditValues {
	out := catalogEditValues{Titles: []catalogEditTitle{}}
	if s, ok := values[fieldWorkDisplayName].(string); ok {
		out.DisplayName = s
	}
	if s, ok := values[fieldWorkOLang].(string); ok {
		out.OLang = s
	}
	if n, ok := values[fieldWorkContentRating].(float64); ok {
		out.ContentRating = int16(n)
	}
	rows, _ := values[fieldWorkTitles].([]any)
	for _, el := range rows {
		row, ok := el.(map[string]any)
		if !ok {
			continue
		}
		title := catalogEditTitle{}
		title.Lang, _ = row["lang"].(string)
		title.Title, _ = row["title"].(string)
		title.Latin, _ = row["latin"].(string)
		if n, ok := row["kind"].(float64); ok {
			title.Kind = int16(n)
		}
		out.Titles = append(out.Titles, title)
	}
	return out
}

func (h *PatchHandler) CatalogEditBootstrap(c fiber.Ctx) error {
	workID, token, done := h.catalogEditContext(c)
	if done != nil {
		return done
	}

	schema, err := h.catalog.GetEditSchemaUser(c.Context(), token, catalogclient.EntityTypeWork, workID)
	if err != nil {
		return catalogEditErr(c, err)
	}
	snapshot, err := h.catalog.GetEditSnapshotUser(c.Context(), token, catalogclient.EntityTypeWork, workID)
	if err != nil {
		return catalogEditErr(c, err)
	}

	fields := make([]catalogclient.EditSchemaField, 0, len(catalogEditFieldKeys))
	canEdit := false
	for _, f := range schema.Fields {
		if !slices.Contains(catalogEditFieldKeys, f.Key) {
			continue
		}
		fields = append(fields, f)
		if f.CanPropose && !f.Locked {
			canEdit = true
		}
	}

	return response.OK(c, fiber.Map{
		"work_id":  workID,
		"can_edit": canEdit,
		"values":   catalogEditSnapshotValues(snapshot.Values),
		"fields":   fields,
	})
}

func (h *PatchHandler) CatalogEditSubmit(c fiber.Ctx) error {
	workID, token, done := h.catalogEditContext(c)
	if done != nil {
		return done
	}

	var req catalogEditRequest
	if err := c.Bind().Body(&req); err != nil {
		return response.Error(c, errors.ErrBadRequest("无法解析请求体"))
	}
	if len([]rune(req.Note)) > catalogEditNoteMax {
		return response.Error(c, errors.ErrValidation("修改说明过长"))
	}

	patch := map[string]any{}
	if req.DisplayName != nil {
		patch[fieldWorkDisplayName] = *req.DisplayName
	}
	if req.OLang != nil {
		patch[fieldWorkOLang] = *req.OLang
	}
	if req.ContentRating != nil {
		patch[fieldWorkContentRating] = *req.ContentRating
	}
	if req.Titles != nil {
		titles := make([]any, 0, len(*req.Titles))
		for _, t := range *req.Titles {
			el := map[string]any{"lang": t.Lang, "title": t.Title, "kind": t.Kind}
			if t.Latin != "" {
				el["latin"] = t.Latin
			}
			titles = append(titles, el)
		}
		patch[fieldWorkTitles] = titles
	}
	if len(patch) == 0 {
		return response.Error(c, errors.ErrValidation("没有需要保存的修改"))
	}

	result, err := h.catalog.CreateEditProposalUser(c.Context(), token, catalogclient.UserEditCreateRequest{
		EntityType: catalogclient.EntityTypeWork,
		EntityID:   workID,
		Patch:      patch,
		Note:       req.Note,
	})
	if err != nil {
		return catalogEditErr(c, err)
	}

	out := fiber.Map{"merged": result.Merged, "proposal": result.Proposal}
	if result.Revision != nil {
		out["revision"] = result.Revision
	}
	return response.OK(c, out)
}

func (h *PatchHandler) CatalogEditProposals(c fiber.Ctx) error {
	workID, token, done := h.catalogEditContext(c)
	if done != nil {
		return done
	}
	items, err := h.catalog.MyEditProposals(c.Context(), token,
		catalogclient.EntityTypeWork, workID, "", 20)
	if err != nil {
		return catalogEditErr(c, err)
	}
	if items == nil {
		items = []catalogclient.EditProposal{}
	}
	return response.OK(c, fiber.Map{"items": items})
}

func (h *PatchHandler) CatalogProposalWithdraw(c fiber.Ctx) error {
	if h.catalog == nil || !h.catalog.Configured() {
		return response.Error(c, errors.ErrCatalogUnavailable(""))
	}
	id, idErr := getIDParam(c, "id")
	if idErr != nil {
		return response.Error(c, idErr.(*errors.AppError))
	}
	token, tErr := catalogUserToken(c)
	if tErr != nil {
		return response.Error(c, tErr)
	}
	prop, err := h.catalog.WithdrawEditProposalUser(c.Context(), token, int64(id))
	if err != nil {
		return catalogEditErr(c, err)
	}
	return response.OK(c, prop)
}

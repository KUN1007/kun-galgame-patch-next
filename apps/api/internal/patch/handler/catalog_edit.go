package handler

import (
	stderrors "errors"
	"log/slog"
	"net/http"
	"slices"

	"kun-galgame-patch-api/pkg/catalogclient"
	"kun-galgame-patch-api/pkg/catalogv2"
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
	case stderrors.Is(err, catalogv2.ErrNotConfigured), stderrors.Is(err, catalogclient.ErrNotConfigured):
		return response.Error(c, errors.ErrCatalogUnavailable(""))
	case stderrors.Is(err, catalogclient.ErrInsufficientScope):
		return response.Error(c, errors.ErrCatalogReauthRequired(""))
	case stderrors.Is(err, catalogv2.ErrForbidden):
		return response.Error(c, errors.New(40300,
			"你没有权限修改该条目（编辑资料需要相应的社区权限）", fiber.StatusForbidden))
	case stderrors.Is(err, catalogv2.ErrNoAccessToken), stderrors.Is(err, catalogclient.ErrNoAccessToken):
		return response.Error(c, errors.ErrUnauthorized())
	case stderrors.Is(err, catalogv2.ErrUnauthorized):
		return response.Error(c, errors.ErrCatalogReauthRequired(
			"资料库拒绝了当前登录凭证，请退出登录后重新登录一次"))
	case stderrors.Is(err, catalogv2.ErrNotFound):
		return response.Error(c, errors.ErrNotFound("资料库中没有这个条目"))
	}

	var p *catalogv2.Problem
	if stderrors.As(err, &p) {
		switch p.Status {
		case http.StatusUnauthorized:
			return response.Error(c, errors.ErrCatalogReauthRequired(
				"资料库拒绝了当前登录凭证，请退出登录后重新登录一次"))
		case http.StatusForbidden:
			if p.Code == "SCOPE_REQUIRED" {
				return response.Error(c, errors.ErrCatalogReauthRequired(""))
			}
			return response.Error(c, errors.New(40300,
				"你没有权限修改该条目（编辑资料需要相应的社区权限）", fiber.StatusForbidden))
		case http.StatusNotFound:
			return response.Error(c, errors.ErrNotFound("资料库中没有这个条目"))
		case http.StatusUnprocessableEntity:
			return response.Error(c, errors.ErrValidation(p.Error()))
		case http.StatusConflict, http.StatusPreconditionFailed:
			return response.Error(c, errors.ErrConflict(
				"条目已被他人修改，或该提案已经关闭，请刷新后重试"))
		case http.StatusTooManyRequests:
			return response.Error(c, errors.ErrTooManyRequests(p.Error()))
		}
		slog.Error("catalog edit: upstream error", "status", p.Status, "code", p.Code, "detail", p.Detail)
		return response.Error(c, errors.ErrCatalogUnavailable(""))
	}

	var apiErr *catalogclient.APIError
	if stderrors.As(err, &apiErr) {
		switch apiErr.Status {
		case http.StatusUnauthorized:
			return response.Error(c, errors.ErrCatalogReauthRequired(
				"资料库拒绝了当前登录凭证，请退出登录后重新登录一次"))
		case http.StatusForbidden:
			return response.Error(c, errors.New(40300,
				"你没有权限修改该条目（编辑资料需要相应的社区权限）", fiber.StatusForbidden))
		case http.StatusNotFound:
			return response.Error(c, errors.ErrNotFound("资料库中没有这个条目"))
		}
		return response.Error(c, errors.ErrCatalogUnavailable(""))
	}

	slog.Warn("catalog edit: unreachable", "error", err)
	return response.Error(c, errors.ErrCatalogUnavailable(""))
}

func (h *PatchHandler) catalogV2() *catalogv2.Client {
	if h.galgame == nil {
		return nil
	}
	return h.galgame.V2()
}

func (h *PatchHandler) catalogEditContext(c fiber.Ctx) (int64, string, error) {
	if h.catalogV2() == nil || !h.catalogV2().Configured() {
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

	v2 := h.catalogV2()
	schema, err := v2.GetSchema(c.Context(), "work")
	if err != nil {
		return catalogEditErr(c, err)
	}
	snapshot, err := v2.Snapshot(c.Context(), token, "work", workID)
	if err != nil {
		return catalogEditErr(c, err)
	}

	fields := make([]catalogclient.EditSchemaField, 0, len(catalogEditFieldKeys))
	canEdit := false
	for _, f := range schema.Fields {
		if !slices.Contains(catalogEditFieldKeys, f.Key) {
			continue
		}
		row := catalogclient.EditSchemaField{
			Key: f.Key, Kind: f.FieldType, DiffHint: f.DiffHint,
			Deprecated: f.Deprecated, MaxSuppressed: f.MaxSuppressed, MaxElements: f.MaxElements,
			CanPropose: !f.Deprecated, Locked: f.Deprecated,
		}
		fields = append(fields, row)
		if row.CanPropose && !row.Locked {
			canEdit = true
		}
	}

	return response.OK(c, fiber.Map{
		"work_id":  workID,
		"can_edit": canEdit,
		"values":   catalogEditSnapshotValues(snapshot.FieldValues),
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

	result, err := h.catalogV2().CreateProposal(c.Context(), token, catalogclient.EntityTypeWork, workID, patch, req.Note)
	if err != nil {
		return catalogEditErr(c, err)
	}
	return response.OK(c, fiber.Map{
		"merged":   result.State == "merged",
		"proposal": proposalView(result),
	})
}

func (h *PatchHandler) CatalogEditProposals(c fiber.Ctx) error {
	workID, token, done := h.catalogEditContext(c)
	if done != nil {
		return done
	}
	page, err := h.catalogV2().ListMyProposals(c.Context(), token, workID, 20)
	if err != nil {
		return catalogEditErr(c, err)
	}
	items := make([]fiber.Map, 0, len(page.Items))
	for i := range page.Items {
		items = append(items, proposalView(&page.Items[i]))
	}
	return response.OK(c, fiber.Map{"items": items})
}

func proposalView(p *catalogv2.ProposalRecord) fiber.Map {
	id, _ := catalogv2.ParseID(p.ID)
	entityID, _ := catalogv2.ParseID(p.EntityID)
	return fiber.Map{
		"id": id, "status": p.State, "state": p.State, "note": p.Note,
		"entity_type": p.EntityType, "entity_id": entityID, "patch": p.Patch,
		"created_at": p.CreatedAt,
	}
}

func (h *PatchHandler) CatalogProposalWithdraw(c fiber.Ctx) error {
	if h.catalogV2() == nil || !h.catalogV2().Configured() {
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
	prop, err := h.catalogV2().WithdrawProposal(c.Context(), token, int64(id))
	if err != nil {
		return catalogEditErr(c, err)
	}
	return response.OK(c, proposalView(prop))
}

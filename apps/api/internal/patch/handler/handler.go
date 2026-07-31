package handler

import (
	"encoding/json"
	stderrors "errors"
	"log/slog"
	"regexp"
	"strconv"
	"strings"

	galgameClient "kun-galgame-patch-api/internal/galgame/client"
	"kun-galgame-patch-api/internal/galgame/enricher"
	"kun-galgame-patch-api/internal/middleware"
	"kun-galgame-patch-api/internal/patch/dto"
	"kun-galgame-patch-api/internal/patch/model"
	"kun-galgame-patch-api/internal/patch/service"
	"kun-galgame-patch-api/pkg/catalogclient"
	"kun-galgame-patch-api/pkg/errors"
	"kun-galgame-patch-api/pkg/response"
	"kun-galgame-patch-api/pkg/userclient"
	"kun-galgame-patch-api/pkg/utils"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

// CreatePatch (register-by-VNDB) and UpdatePatch always need a well-formed
// vndb_id — they look the galgame up on galgame by VNDB. VNDB-less publishing is a
// separate path (SubmitGalgame → galgame, which gates it on the creator role).
var vndbIDRegex = regexp.MustCompile(`^v\d+$`)

type PatchHandler struct {
	service *service.PatchService
	galgame *galgameClient.Client
	// catalog is the registry's S2S face: the claim lifecycle (submit / publish
	// / withdraw) and the per-user claim list the "my submissions" page reads.
	catalog *catalogclient.Client
	users   *userclient.Client
}

func New(
	svc *service.PatchService,
	galgame *galgameClient.Client,
	catalog *catalogclient.Client,
	users *userclient.Client,
) *PatchHandler {
	return &PatchHandler{service: svc, galgame: galgame, catalog: catalog, users: users}
}

// claimSite is the tenant moyu acts as on the registry.
//
// moyu and kungal are two entrances to ONE galgame product, which is what the
// shared gid key space has meant for a decade: a moyu submission has always
// minted an entry in the same catalogue kungal reads, and moyu's local patch id
// IS that entry's id. So moyu's client binds this site rather than a `moyu`
// tenant of its own — a separate tenant would mean a second registry identity
// for the same game, and moyu's own reads (which require this site to derive a
// gid) would not even find it.
const claimSite = catalogclient.ClaimSiteKungal

// claimActor asserts the logged-in user to the registry. The catalog never sees
// moyu's session; the product asserts identity and the registry records it.
func claimActor(c fiber.Ctx) catalogclient.EditActor {
	return catalogclient.EditActor{
		UserID: int64(middleware.MustGetUser(c).ID),
		Roles:  middleware.GetRoles(c),
	}
}

// catalogErr renders a registry failure. A 409 is not an accident — it is the
// lifecycle face answering "that move is illegal from where this claim
// currently is", or "you already submitted this" — so its message is shown to
// the user verbatim rather than flattened into a 500.
func catalogErr(c fiber.Ctx, err error, fallback string) error {
	var apiErr *catalogclient.APIError
	if stderrors.As(err, &apiErr) && apiErr.Status >= 400 && apiErr.Status < 500 {
		return response.Error(c, errors.New(apiErr.Code, apiErr.Message, apiErr.Status))
	}
	return response.Error(c, errors.ErrInternal(fallback))
}

// resolveWorkID maps the gid in the path onto the registry work id the
// lifecycle actions address, or answers 404. The frontend keeps speaking gids:
// for entries born after the switchover the two ids are the same number, and
// for everything older the anchor bridge translates.
func (h *PatchHandler) resolveWorkID(c fiber.Ctx, gid int) (int64, error) {
	workID, found, err := h.galgame.ResolveWorkID(c.Context(), gid)
	if err != nil {
		return 0, response.Error(c, errors.ErrInternal("解析资料库条目失败"))
	}
	if !found {
		return 0, response.Error(c, errors.ErrNotFound("资料库中没有这个条目"))
	}
	return workID, nil
}

func getIDParam(c fiber.Ctx, name string) (int, error) {
	id, err := strconv.Atoi(c.Params(name))
	if err != nil || id < 1 {
		return 0, errors.ErrBadRequest("invalid ID")
	}
	return id, nil
}

// gatePatchByContentLimit checks whether `patchID`'s owning galgame passes the
// caller's content_limit filter. Returns true → handler may serve the data;
// false → handler MUST respond 404 (mirrors how /api/patch/:id itself handles
// the NSFW miss).
//
// Used by sub-endpoints (/comment, /resource, /contributor, comment/:id/markdown)
// that don't go through the main enricher but still expose patch-coupled data
// — comment text, resource notes, contributor list, etc. A direct call to e.g.
// /api/patch/<nsfw-id>/comment must not list comments from anonymous (sfw)
// callers, even though the parent detail endpoint already 404s for them.
//
// Defaults to sfw via ContentLimitForListBrowse: an anonymous crawler with no
// content_limit query gets the SEO-safe path. galgame transient failure fails
// closed (return false) — same SEO-safety reasoning as enricher / FilterBy.
func (h *PatchHandler) gatePatchByContentLimit(c fiber.Ctx, patchID int) bool {
	cl := utils.ContentLimitForListBrowse(c)
	if cl == "" || h.galgame == nil {
		return true
	}
	briefs, err := h.galgame.GalgameBatch(c.Context(), []int{patchID}, cl)
	if err != nil {
		return false
	}
	return len(briefs) > 0
}

// ===== Patch CRUD =====

// ensureCanPublishGalgame enforces the "creator_only" publish toggle: when on,
// only the trusted-publisher set — creators / moderators / admins — may publish
// Galgame (the toggle exists to fall back to that set during an abuse wave).
// Returns a 403 AppError to block, or nil to allow. Applied to every publish
// entry point (CreatePatch / ClaimGalgame / SubmitGalgame) so the gate can't be
// bypassed by hitting a different publish route.
func (h *PatchHandler) ensureCanPublishGalgame(c fiber.Ctx) *errors.AppError {
	if h.service.IsCreatorOnlyEnabled() && !middleware.IsModerator(c) && !middleware.HasRole(c, "creator") {
		return errors.New(40300, "本站当前仅允许创作者 / 版主 / 管理员发布 Galgame", fiber.StatusForbidden)
	}
	return nil
}

// CreatePatch POST /api/patch
//
// Body is JSON { "galgame_id": N } — register a local carrier for a galgame
// that is ALREADY published on the catalog. galgame_id (not vndb_id) is the key
// because 原创/同人 works have none; their row stores a synthetic `wiki-<id>`.
//
// The legacy vndb_id form was removed in 2026-07: nothing sent it after the
// publish wizard switched to galgame_id, and it was actively harmful — it
// resolved through the vndb reverse lookup (now /v1/catalog/lookup), which DOES
// see unclaimed status=2 VNDB drafts because the catalog's claimed_by pointer is
// status-blind, so it could register a carrier on a draft that the read faces
// then refuse to serve, producing a patch page with no metadata at all. Claiming
// a draft goes through POST /galgame/:gid/claim, which publishes it first.
//
// Publish gate: by default any logged-in user may create a patch. The admin
// "creator_only" toggle narrows publishing to the trusted-publisher set
// (creator / moderator / admin) — see ensureCanPublishGalgame, applied to
// every publish entry point.
func (h *PatchHandler) CreatePatch(c fiber.Ctx) error {
	if appErr := h.ensureCanPublishGalgame(c); appErr != nil {
		return response.Error(c, appErr)
	}
	user := middleware.MustGetUser(c)

	var req dto.PatchCreateRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if req.GalgameID <= 0 {
		return response.Error(c, errors.ErrBadRequest("请提供 galgame_id"))
	}

	id, err := h.service.CreatePatchByGalgameID(c.Context(), user.ID, req.GalgameID)
	if err != nil {
		// Distinct error code so the frontend can render a "提交新作" CTA when
		// the galgame isn't publicly visible on the catalog, vs the generic
		// toast for any other failure (e.g. duplicate vndb_id locally).
		if stderrors.Is(err, service.ErrGalgameMissing) {
			return response.Error(c, errors.ErrGalgameNotFound(""))
		}
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OK(c, map[string]int{"id": id})
}

// headerCard flattens GalgameCard + is_favorite to match the frontend PatchHeader shape.
type headerCard struct {
	enricher.GalgameCard
	IsFavorite bool `json:"is_favorite"`
}

// GetPatch GET /api/patch/:id
//
// D12: return the flat GalgameCard structure directly (no longer wrapped in patch / is_favorite layers).
// Frontend PatchHeader = GalgameCard + isFavorite.
//
// NSFW: forwards content_limit to galgame (default sfw — moyu is stricter than
// galgame's "detail default = no filter" because *moyu's* detail surface is what
// the search engine indexes). When galgame filters this id out, the enricher
// returns nil and we 404 — the same shape as a missing patch.
func (h *PatchHandler) GetPatch(c fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	cl := utils.ContentLimitForListBrowse(c)
	patch, err := h.service.GetPatch(c.Context(), id)
	if err != nil {
		// No local row → render the galgame as a read-only "本站尚未收录"
		// header (is_on_forum=false) instead of 404'ing. moyu materializes a row
		// only on a real publish/claim, not on view. nil = not on galgame / filtered
		// by content_limit (preserves the NSFW gate) → genuine 404.
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			if card := enricher.GalgameOnlyCard(c.Context(), h.galgame, h.users, id, cl); card != nil {
				return response.OK(c, headerCard{GalgameCard: *card})
			}
		}
		return response.Error(c, errors.ErrNotFound("patch not found"))
	}

	enriched := enricher.EnrichPatch(c.Context(), h.galgame, h.users, patch, cl)
	if enriched == nil {
		return response.Error(c, errors.ErrNotFound("patch not found"))
	}

	card := headerCard{GalgameCard: *enriched}
	if user := middleware.GetUser(c); user != nil {
		card.IsFavorite = h.service.IsFavorited(user.ID, id)
	}
	return response.OK(c, card)
}

// GetPatchDetail GET /api/patch/:id/detail
//
// D12: detail enrichment goes through galgame /galgame/:gid to additionally fetch intro / tag_ids / official_ids.
//
// NSFW: same gating as GetPatch — content_limit forwarded to galgame, default
// sfw, nil from enricher → 404. The introduction_html / tags / officials this
// endpoint emits are the biggest single NSFW surface in moyu's SSR output
// (Google indexes the full intro text), so 404'ing on a filter miss matters
// even more here than on GetPatch.
func (h *PatchHandler) GetPatchDetail(c fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	cl := utils.ContentLimitForListBrowse(c)
	patch, err := h.service.GetPatchDetail(c.Context(), id)
	if err != nil {
		// No local row → galgame-only detail (is_on_forum=false); see GetPatch.
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			if detail := enricher.GalgameOnlyDetail(c.Context(), h.galgame, h.users, id, cl); detail != nil {
				return response.OK(c, detail)
			}
		}
		return response.Error(c, errors.ErrNotFound("patch not found"))
	}
	enriched := enricher.EnrichPatchDetail(c.Context(), h.galgame, h.users, patch, cl)
	if enriched == nil {
		return response.Error(c, errors.ErrNotFound("patch not found"))
	}
	return response.OK(c, enriched)
}

// UpdatePatch PUT /api/patch/:id
//
// After D12 this only permits "rebinding vndb_id": the owner may rebind their
// own patch; rebinding someone else's requires moderator/admin (isPrivileged).
// Game name/introduction/banner etc. all live in galgame; this endpoint no longer accepts them.
func (h *PatchHandler) UpdatePatch(c fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.PatchUpdateRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	if !vndbIDRegex.MatchString(req.VndbID) {
		return response.Error(c, errors.ErrBadRequest("vndb_id 格式不合法"))
	}

	user := middleware.MustGetUser(c)
	isPrivileged := middleware.IsModerator(c)
	if err := h.service.UpdatePatch(c.Context(), id, user.ID, isPrivileged, req.VndbID); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	return response.OKMessage(c, "Patch updated")
}

// DeletePatch DELETE /api/patch/:id
func (h *PatchHandler) DeletePatch(c fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	isAdmin := middleware.IsAdmin(c)
	if err := h.service.DeletePatch(id, user.ID, isAdmin); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Patch deleted")
}

// IncrementView PUT /api/patch/:id/view
func (h *PatchHandler) IncrementView(c fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	h.service.IncrementView(id)
	return response.OKMessage(c, "OK")
}

// ===== Comments =====

// GetComments GET /api/patch/:id/comment
//
// NSFW gate: same shape as GetPatch — anonymous (sfw) callers see 404 on a
// NSFW patch's comment list, so direct hits to /patch/<nsfw>/comment can't
// bypass the SEO filter that already protects the parent detail endpoint.
func (h *PatchHandler) GetComments(c fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	if !h.gatePatchByContentLimit(c, id) {
		return response.Error(c, errors.ErrNotFound("patch not found"))
	}

	var req dto.GetPatchCommentRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	currentUID := middleware.GetUserID(c)
	comments, total, err := h.service.GetComments(c.Context(), id, currentUID, req.Page, req.Limit)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}

	return response.Paginated(c, comments, total)
}

// CreateComment POST /api/patch/:id/comment
func (h *PatchHandler) CreateComment(c fiber.Ctx) error {
	patchID, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.PatchCommentCreateRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	req.GalgameID = patchID

	user := middleware.MustGetUser(c)
	comment, err := h.service.CreateComment(patchID, user.ID, req.Content, req.ParentID)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	// Background notifications — only for immediately-visible comments. When
	// the comment is pending review (comment-verify), notifications are
	// deferred to ApproveComment so we don't ping mentioned users / the patch
	// owner about a comment that may be rejected.
	if comment.Status == 0 {
		go func() {
			h.service.CreateMentionMessages(user.ID, comment, req.Content)
			h.service.CreateCommentNotification(user.ID, comment)
		}()
	}

	return response.OK(c, comment)
}

// GetResourceComments GET /api/patch/resource/:resourceId/comment
//
// One resource's comment area (migration 028). NSFW-gated through the owning
// patch exactly like GetComments: comment bodies discuss the game, and the
// resource detail page itself 404s for sfw callers on a NSFW game, so this list
// must not be readable there either.
func (h *PatchHandler) GetResourceComments(c fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	patchID, pErr := h.service.GetResourcePatchID(resourceID)
	if pErr != nil {
		return response.Error(c, errors.ErrNotFound("resource not found"))
	}
	if !h.gatePatchByContentLimit(c, patchID) {
		return response.Error(c, errors.ErrNotFound("resource not found"))
	}

	var req dto.GetPatchCommentRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	currentUID := middleware.GetUserID(c)
	comments, total, gErr := h.service.GetResourceComments(c.Context(), resourceID, currentUID, req.Page, req.Limit)
	if gErr != nil {
		return response.Error(c, errors.ErrInternal(""))
	}

	return response.Paginated(c, comments, total)
}

// CreateResourceComment POST /api/patch/resource/:resourceId/comment
func (h *PatchHandler) CreateResourceComment(c fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.PatchCommentCreateRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	user := middleware.MustGetUser(c)
	comment, cErr := h.service.CreateResourceComment(resourceID, user.ID, req.Content, req.ParentID)
	if cErr != nil {
		return response.Error(c, errors.ErrBadRequest(cErr.Error()))
	}

	// Same deferral as CreateComment: a pending (comment-verify) comment's
	// notifications wait for ApproveComment.
	if comment.Status == 0 {
		go func() {
			h.service.CreateMentionMessages(user.ID, comment, req.Content)
			h.service.CreateCommentNotification(user.ID, comment)
		}()
	}

	return response.OK(c, comment)
}

// ApproveComment PUT /api/admin/comment/:id/approve
//
// Flips a pending comment (comment-verify) to approved, applying the deferred
// visible-comment side effects (comment_count, owner moemoepoint, contributor)
// and firing the deferred mention / comment notifications. Idempotent.
// Registered under the moderator-gated /admin group.
func (h *PatchHandler) ApproveComment(c fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	comment, aerr := h.service.ApproveComment(id)
	if aerr != nil {
		return response.Error(c, errors.ErrBadRequest(aerr.Error()))
	}
	go func() {
		h.service.CreateMentionMessages(comment.UserID, comment, comment.Content)
		h.service.CreateCommentNotification(comment.UserID, comment)
	}()
	return response.OK(c, comment)
}

// UpdateComment PUT /api/patch/comment/:commentId
func (h *PatchHandler) UpdateComment(c fiber.Ctx) error {
	commentID, err := getIDParam(c, "commentId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.PatchCommentUpdateRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	user := middleware.MustGetUser(c)
	comment, err := h.service.UpdateComment(commentID, user.ID, req.Content)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OK(c, comment)
}

// DeleteComment DELETE /api/patch/comment/:commentId
func (h *PatchHandler) DeleteComment(c fiber.Ctx) error {
	commentID, err := getIDParam(c, "commentId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	isPrivileged := middleware.IsModerator(c)
	if err := h.service.DeleteComment(commentID, user.ID, isPrivileged, parseDeleteReason(c)); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Comment deleted")
}

// parseDeleteReason reads an OPTIONAL moderation reason from the request body
// ({"reason":"..."}) sent when a mod/admin deletes someone else's content from
// the game-detail page. Absent / non-JSON body → "" (owner self-deletes send
// nothing). Trimmed + rune-capped at 500 so it fits admin_log.content cleanly.
func parseDeleteReason(c fiber.Ctx) string {
	var body struct {
		Reason string `json:"reason"`
	}
	_ = c.Bind().Body(&body)
	r := strings.TrimSpace(body.Reason)
	if rs := []rune(r); len(rs) > 500 {
		r = string(rs[:500])
	}
	return r
}

// ToggleCommentLike PUT /api/patch/comment/:commentId/like
func (h *PatchHandler) ToggleCommentLike(c fiber.Ctx) error {
	commentID, err := getIDParam(c, "commentId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	liked, err := h.service.ToggleCommentLike(commentID, user.ID)
	if err != nil {
		// The only error this returns is "comment not found" → 404, not 400
		// (audit F034).
		return response.Error(c, errors.ErrNotFound(err.Error()))
	}

	return response.OK(c, map[string]bool{"liked": liked})
}

// GetCommentMarkdown GET /api/patch/comment/:commentId/markdown
//
// NSFW gate: look up the comment's owning patch and apply the same
// content_limit check the parent /patch/:id/comment list applies. Without
// this an anonymous caller who knows a NSFW comment id could fetch its raw
// markdown — same exfiltration surface as GetComments itself.
func (h *PatchHandler) GetCommentMarkdown(c fiber.Ctx) error {
	commentID, err := getIDParam(c, "commentId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	patchID, pErr := h.service.GetCommentPatchID(commentID)
	if pErr != nil {
		return response.Error(c, errors.ErrNotFound("comment not found"))
	}
	if !h.gatePatchByContentLimit(c, patchID) {
		return response.Error(c, errors.ErrNotFound("comment not found"))
	}

	md, err := h.service.GetCommentMarkdown(commentID)
	if err != nil {
		return response.Error(c, errors.ErrNotFound("comment not found"))
	}

	return response.OK(c, map[string]string{"markdown": md})
}

// LocateComment GET /api/patch/comment/:commentId/locate?limit=N
//
// Resolves a comment id to {page, root_id, is_reply, galgame_id} in the
// paginated root-comment list so a deep-link can jump straight to it.
// NSFW-gated like GetCommentMarkdown so a NSFW comment's location can't be
// probed anonymously.
func (h *PatchHandler) LocateComment(c fiber.Ctx) error {
	commentID, err := getIDParam(c, "commentId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	patchID, pErr := h.service.GetCommentPatchID(commentID)
	if pErr != nil {
		return response.Error(c, errors.ErrNotFound("comment not found"))
	}
	if !h.gatePatchByContentLimit(c, patchID) {
		return response.Error(c, errors.ErrNotFound("comment not found"))
	}

	limit, _ := strconv.Atoi(c.Query("limit", "30"))
	res, lErr := h.service.LocateComment(commentID, limit)
	if lErr != nil {
		return response.Error(c, errors.ErrNotFound("comment not found"))
	}
	return response.OK(c, res)
}

// ===== Resources =====

// GetResources GET /api/patch/:id/resource
//
// NSFW gate: same as GetComments. Resource notes / titles may describe NSFW
// content explicitly, so listing them under a NSFW patch must 404 for sfw
// callers — even though the resource rows themselves don't carry
// content_limit (the field lives on the owning patch via galgame).
func (h *PatchHandler) GetResources(c fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	if !h.gatePatchByContentLimit(c, id) {
		return response.Error(c, errors.ErrNotFound("patch not found"))
	}

	currentUID := middleware.GetUserID(c)
	resources, err := h.service.GetResources(c.Context(), id, currentUID)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}

	return response.OK(c, resources)
}

// CreateResource POST /api/patch/:id/resource
func (h *PatchHandler) CreateResource(c fiber.Ctx) error {
	patchID, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.PatchResourceCreateRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	user := middleware.MustGetUser(c)
	resource := &model.PatchResource{
		GalgameID:    patchID,
		Storage:      req.Storage,
		Name:         req.Name,
		ModelName:    req.ModelName,
		ArtifactUUID: req.ArtifactUUID,
		S3Key:        req.S3Key,
		Content:      req.Content,
		Size:         req.Size,
		Code:         req.Code,
		Password:     req.Password,
		Note:         req.Note,
		Type:         model.JSONArray(req.Type),
		Language:     model.JSONArray(req.Language),
		Platform:     model.JSONArray(req.Platform),
	}

	if err := h.service.CreateResource(c.Context(), resource, user.ID); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OK(c, resource)
}

// UpdateResource PUT /api/patch/resource/:resourceId
func (h *PatchHandler) UpdateResource(c fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	var req dto.PatchResourceUpdateRequest
	if err := utils.ParseAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	user := middleware.MustGetUser(c)
	update := &model.PatchResource{
		Storage:      req.Storage,
		Name:         req.Name,
		ModelName:    req.ModelName,
		ArtifactUUID: req.ArtifactUUID,
		S3Key:        req.S3Key,
		Content:      req.Content,
		Size:         req.Size,
		Code:         req.Code,
		Password:     req.Password,
		Note:         req.Note,
		Type:         model.JSONArray(req.Type),
		Language:     model.JSONArray(req.Language),
		Platform:     model.JSONArray(req.Platform),
	}

	// Snapshot the actor's privilege so the file-history row records who+role
	// at time of edit (MOYU-PR5 / M3). Mirrors the galgame revision convention
	// (3=admin / 2=mod / 1=user / 0=unknown).
	actorRole := 1
	if middleware.IsAdmin(c) {
		actorRole = 3
	} else if middleware.HasRole(c, "moderator") {
		actorRole = 2
	}

	updated, err := h.service.UpdateResource(c.Context(), resourceID, user.ID, update, req.Reason, actorRole)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	// Return the fully-rendered row (with new note_html, update_time, user
	// brief) so the frontend can replace its local list entry directly
	// instead of patching together a partial merge — that path used to keep
	// the old note_html and confused the user ("note 改了但简介没变").
	return response.OK(c, updated)
}

// DeleteResource DELETE /api/patch/resource/:resourceId
func (h *PatchHandler) DeleteResource(c fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	// Option B: privileged users (moderator / admin) can delete any resource
	// from the public page; non-privileged callers fall through to the
	// owner check inside the service.
	isPrivileged := middleware.IsModerator(c)
	if err := h.service.DeleteResource(resourceID, user.ID, isPrivileged, parseDeleteReason(c)); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "Resource deleted")
}

// ToggleResourceDisable PUT /api/patch/resource/:resourceId/disable
func (h *PatchHandler) ToggleResourceDisable(c fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	isPrivileged := middleware.IsModerator(c)
	status, err := h.service.ToggleResourceDisable(resourceID, user.ID, isPrivileged)
	if err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OK(c, fiber.Map{"status": status})
}

// IncrementResourceDownload PUT /api/patch/resource/:resourceId/download
// GetResourceDownloadInfo GET /api/patch/resource/:resourceId/link
//
// Minimal payload for the "获取资源链接" reveal on the patch resource list:
// only the storage type + download links + secrets. No galgame enrichment, no
// recommendations, no blake3 (the card already shows the hash).
func (h *PatchHandler) GetResourceDownloadInfo(c fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	r, gErr := h.service.GetResourceDownloadInfo(resourceID)
	if gErr != nil {
		return response.Error(c, errors.ErrNotFound("resource not found"))
	}
	// NSFW gate: matches the resource-list endpoint's gate so an anonymous
	// caller can't hop directly to the download link of a NSFW patch's
	// resource by knowing its id. The download URL itself (B2 / user link)
	// would otherwise be leaked even though no patch metadata is.
	if !h.gatePatchByContentLimit(c, r.GalgameID) {
		return response.Error(c, errors.ErrNotFound("resource not found"))
	}
	// Moderation-hidden (status=2, trust enforcement): 404, same as the detail
	// endpoint — the resource must look nonexistent, not "disabled".
	if r.Status == 2 {
		return response.Error(c, errors.ErrNotFound("resource not found"))
	}
	// Disabled resources (status = 1) have their download link withheld — the
	// owner/admin pulled it (e.g. virus). The row stays visible (marked 已禁用)
	// but the link can't be fetched. Distinct 403 code so the frontend can show
	// a clear "已禁用" message instead of a generic failure.
	if r.Status != 0 {
		return response.Error(c, errors.New(40310, "该资源已被禁用，暂时无法下载", fiber.StatusForbidden))
	}
	// Resolve the artifact download URL only AFTER the gates pass (it issues a
	// usable URL). Legacy rows are untouched (FE builds from content).
	if err := h.service.ResolveDownloadURL(c.Context(), r); err != nil {
		return response.Error(c, errors.ErrInternal("获取下载地址失败"))
	}
	return response.OK(c, fiber.Map{
		"storage": r.Storage,
		// content = legacy s3_key/link (FE builds the URL); download_url = the
		// resolved artifact-service URL for artifact-backed rows (FE uses it
		// directly). Exactly one is meaningful per row (dual-read).
		"content":      r.Content,
		"download_url": r.DownloadURL,
		"code":         r.Code,
		"password":     r.Password,
	})
}

func (h *PatchHandler) IncrementResourceDownload(c fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	if err := h.service.IncrementResourceDownload(resourceID); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}

	return response.OKMessage(c, "OK")
}

// ToggleResourceLike PUT /api/patch/resource/:resourceId/like
func (h *PatchHandler) ToggleResourceLike(c fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	liked, err := h.service.ToggleResourceLike(resourceID, user.ID)
	if err != nil {
		// Only "resource not found" → 404, not 400 (audit F034).
		return response.Error(c, errors.ErrNotFound(err.Error()))
	}

	return response.OK(c, map[string]bool{"liked": liked})
}

// ToggleResourceFavorite PUT /api/patch/resource/:resourceId/favorite
//
// Per-resource SUBSCRIPTION — distinct from the resource LIKE (appreciation) and
// the galgame FAVORITE (notified on new resources). A subscriber gets a
// patchResourceUpdate notification when this resource's file/link changes.
func (h *PatchHandler) ToggleResourceFavorite(c fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	favorited, err := h.service.ToggleResourceFavorite(resourceID, user.ID)
	if err != nil {
		// Generic message — never leak the raw DB error (e.g. a missing-table
		// "relation does not exist" when migration 017 hasn't run) to the client.
		slog.Error("ToggleResourceFavorite failed", "resourceID", resourceID, "error", err)
		return response.Error(c, errors.ErrInternal("收藏失败，请稍后重试"))
	}

	return response.OK(c, map[string]bool{"favorited": favorited})
}

// ===== Favorites =====

// ToggleFavorite PUT /api/patch/:id/favorite
func (h *PatchHandler) ToggleFavorite(c fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}

	user := middleware.MustGetUser(c)
	favorited, err := h.service.ToggleFavorite(id, user.ID)
	if err != nil {
		// Generic message — don't leak the raw DB error to the client.
		slog.Error("ToggleFavorite failed", "patchID", id, "error", err)
		return response.Error(c, errors.ErrInternal("收藏失败，请稍后重试"))
	}

	return response.OK(c, map[string]bool{"favorited": favorited})
}

// ===== Contributors =====

// GetContributors GET /api/patch/:id/contributor
//
// Returns publisher briefs (id/name/avatar) batch-resolved from OAuth
// /users/batch. The local DB only stores the contributor user_ids.
func (h *PatchHandler) GetContributors(c fiber.Ctx) error {
	id, err := getIDParam(c, "id")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	if !h.gatePatchByContentLimit(c, id) {
		return response.Error(c, errors.ErrNotFound("patch not found"))
	}

	ids, err := h.service.GetContributorIDs(id)
	if err != nil {
		return response.Error(c, errors.ErrInternal(""))
	}

	briefs := userclient.BriefMapByInt(c.Context(), h.users, ids)
	out := make([]model.PatchUser, 0, len(ids))
	for _, userID := range ids {
		if b := briefs[userID]; b != nil {
			out = append(out, model.PatchUser{ID: int(b.ID), Name: b.Name, Avatar: b.Avatar, AvatarImageHash: b.AvatarImageHash, Roles: b.Roles, SiteRoles: b.SiteRoles})
		}
	}
	return response.OK(c, out)
}

// GetRandomPatch GET /api/home/random
//
// NSFW: forwards content_limit so the random landing page can't dump a NSFW
// patch into an anonymous (sfw-default) browser session. Service drains a
// 60-row random sample through galgame batch and picks from the survivors.
func (h *PatchHandler) GetRandomPatch(c fiber.Ctx) error {
	id, err := h.service.GetRandomPatchID(c.Context(), utils.ContentLimitForListBrowse(c), utils.IncludeEmptyGalgames(c))
	if err != nil {
		// "no candidate passes the content_limit filter" is a not-found, not a
		// server fault — return 404 instead of a 500 that trips alerting (audit
		// F083). The NSFW fail-closed logic is preserved.
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			return response.Error(c, errors.ErrNotFound("no patch available"))
		}
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.OK(c, map[string]int{"id": id})
}

// writeGalgameResult is the shared result -> response mapping for both modes.
// galgame business errors (e.g. 80008 image quota, 60002 review rejected,
// 40300 forbidden) flow through as-is via GalgameError so the frontend can
// render specific messages.
func writeGalgameResult(c fiber.Ctx, data json.RawMessage, err error) error {
	if err != nil {
		if werr, ok := err.(*galgameClient.GalgameError); ok {
			return response.Error(c, errors.New(werr.Code, werr.Message, fiber.StatusBadRequest))
		}
		return response.Error(c, errors.ErrInternal("调用 Galgame 资料库失败"))
	}
	return c.JSON(response.Response{Code: 0, Message: "OK", Data: data})
}

// ===== galgame submission proxies (docs/galgame_wiki/07-submission.md) =====
//
// Each endpoint is a thin pass-through to galgame: extract the user's
// access_token from the session, forward verbatim, surface galgame's business
// errors as-is. The site backend does not re-implement authorization —
// galgame decodes the JWT and enforces submitter / status rules itself.

// SubmitGalgame POST /api/v1/galgame/submit
//
// Mints a new entry in the registry, in the `pending` claim state, and answers
// with the id it was given. One request, one transaction on the registry side:
// the row, its content and the birth event land together or not at all.
//
// No product id is sent. moyu's local patch id IS the shared gid, a key space
// it does not mint, so the registry allocates and moyu adopts the answer —
// which is also why the wizard can navigate straight to a page keyed by it.
//
// No local patch row is created here, deliberately: a pending submission is not
// published on moyu, has no resources, and its +3 arrives with the approval
// through the claim-event cron. The row materializes the first time somebody
// interacts with the entry, exactly as it does for any other catalogue game.
func (h *PatchHandler) SubmitGalgame(c fiber.Ctx) error {
	if appErr := h.ensureCanPublishGalgame(c); appErr != nil {
		return response.Error(c, appErr)
	}
	if h.catalog == nil || !h.catalog.Configured() {
		return response.Error(c, errors.ErrInternal("资料库客户端未配置"))
	}
	var form SubmissionForm
	if err := c.Bind().Body(&form); err != nil {
		return response.Error(c, errors.ErrBadRequest("无法解析请求体"))
	}
	fields, fErr := form.SubmissionFields()
	if fErr != nil {
		return response.Error(c, errors.ErrBadRequest(fErr.Error()))
	}
	out, err := h.catalog.SubmitWork(c.Context(), catalogclient.WorkSubmitRequest{
		Site: claimSite, Actor: claimActor(c), Fields: fields,
	})
	if err != nil {
		return catalogErr(c, err, "提交到资料库失败")
	}
	return c.JSON(response.Response{
		Code: 0, Message: "OK",
		Data: fiber.Map{"id": out.WorkID, "claim_state": out.ClaimState},
	})
}

// ClaimGalgame POST /api/v1/galgame/:gid/claim
//
// Publish an unclaimed draft (claim_state draft → live), then register the
// local patch row + award +3 moemoepoint atomically. The frontend must NOT
// additionally POST /patch — that produced a double +3.
//
// The registry addresses works by its own id while the wizard speaks gids, so
// the path id is translated first. For an entry born after the switchover the
// two are the same number; for a wiki-era one the anchor bridge translates.
//
// Response payload: { "id": <local patch id == gid> } so the frontend can
// navigate straight to /patch/:id without a second round-trip.
func (h *PatchHandler) ClaimGalgame(c fiber.Ctx) error {
	if appErr := h.ensureCanPublishGalgame(c); appErr != nil {
		return response.Error(c, appErr)
	}
	gid, idErr := getIDParam(c, "gid")
	if idErr != nil {
		return response.Error(c, idErr.(*errors.AppError))
	}
	if h.catalog == nil || !h.catalog.Configured() {
		return response.Error(c, errors.ErrInternal("资料库客户端未配置"))
	}
	workID, hErr := h.resolveWorkID(c, gid)
	if hErr != nil {
		return hErr
	}
	if _, err := h.catalog.ActOnClaim(c.Context(), workID,
		catalogclient.ClaimActionPublish,
		catalogclient.ClaimActionRequest{Site: claimSite, Actor: claimActor(c)}); err != nil {
		// A 409 here is the registry saying the claim is not in `draft` any
		// more — someone else took it, or it is a submission under review. That
		// refusal is the answer, not a fault, and the wizard re-searches on it.
		return catalogErr(c, err, "调用资料库失败")
	}

	// vndb_id is looked up rather than taken from the action's answer: the
	// lifecycle face reports the transition, not the entry's identity anchors.
	// A miss leaves the deterministic wiki-<id> placeholder the local unique
	// index needs, which is what the interaction path already writes.
	vndbID := ""
	if briefs, bErr := h.galgame.GalgameBatch(c.Context(), []int{gid}, ""); bErr == nil {
		for i := range briefs {
			if briefs[i].ID == gid {
				vndbID = briefs[i].VndbID
				break
			}
		}
	}

	userID := middleware.MustGetUser(c).ID
	patchID, regErr := h.service.RegisterClaimedGalgame(userID, gid, vndbID)
	if regErr != nil {
		// The registry-side publish already succeeded and cannot be rolled
		// back; the entry is live and owned by the user. Surface a soft error
		// so the local registration can be retried through the detail page's
		// first interaction, but do not pretend the whole thing failed.
		return response.Error(c, errors.ErrInternal("认领成功，但本站登记失败，请稍后重试"))
	}

	return c.JSON(response.Response{
		Code:    0,
		Message: "OK",
		Data:    fiber.Map{"id": patchID},
	})
}

// WithdrawGalgameSubmission DELETE /api/v1/galgame/:gid
//
// Take one's own submission back out of the review queue (claim_state → draft).
//
// It used to HARD-DELETE the wiki draft, and that verb does not survive the
// move to the registry — deliberately, not for want of an endpoint. A registry
// row is an identity, and identities do not disappear because a product
// withdrew a submission: the entry stays, unclaimed and unpublished, and the
// same person (or anyone else) can pick it up again later. The route keeps its
// DELETE method so no client has to change, but the copy around it says
// 撤回, not 删除.
//
// The local patch carrier row, if one exists, is moyu's own business and stays:
// it holds the likes, comments and ratings collected while the entry was up.
func (h *PatchHandler) WithdrawGalgameSubmission(c fiber.Ctx) error {
	gid, idErr := getIDParam(c, "gid")
	if idErr != nil {
		return response.Error(c, idErr.(*errors.AppError))
	}
	if h.catalog == nil || !h.catalog.Configured() {
		return response.Error(c, errors.ErrInternal("资料库客户端未配置"))
	}
	workID, hErr := h.resolveWorkID(c, gid)
	if hErr != nil {
		return hErr
	}
	if _, err := h.catalog.ActOnClaim(c.Context(), workID,
		catalogclient.ClaimActionWithdraw,
		catalogclient.ClaimActionRequest{Site: claimSite, Actor: claimActor(c)}); err != nil {
		return catalogErr(c, err, "调用资料库失败")
	}
	return response.OKMessage(c, "OK")
}

// ListMyGalgames GET /api/v1/galgame/mine
//
// The caller's own submissions, from the registry's per-user claim face.
//
// `status` is gone from the wire: the page asked the wiki for status 3,4
// (pending / declined) and now asks for the claim states that mean the same
// two things. The cursor is keyset, not a page number — the face orders by the
// latest transition, which a page offset cannot address stably while reviews
// are landing.
func (h *PatchHandler) ListMyGalgames(c fiber.Ctx) error {
	if h.catalog == nil || !h.catalog.Configured() {
		return response.Error(c, errors.ErrInternal("资料库客户端未配置"))
	}
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	if limit < 1 || limit > 50 {
		limit = 20
	}
	before, _ := strconv.ParseInt(c.Query("before", "0"), 10, 64)

	states := mySubmissionStates
	if raw := strings.TrimSpace(c.Query("claim_state", "")); raw != "" {
		states = nil
		for _, s := range strings.Split(raw, ",") {
			if s = strings.TrimSpace(s); s != "" {
				states = append(states, s)
			}
		}
	}
	out, err := h.catalog.UserClaims(c.Context(), middleware.MustGetUser(c).ID,
		catalogclient.UserClaimFilter{
			Site: claimSite, ClaimStates: states, Before: before, Limit: limit,
		})
	if err != nil {
		return catalogErr(c, err, "调用资料库失败")
	}
	return response.OK(c, out)
}

// mySubmissionStates is what "我的提交" means: the two states a submitter still
// has something to do about. `live` is excluded because a published entry is
// reached through its own page, and `hidden` because a ban is not a submission
// the user can act on.
var mySubmissionStates = []string{
	catalogclient.ClaimStatePending,
	catalogclient.ClaimStateDeclined,
}

// SearchGalgameForPublish GET /api/v1/galgame/search/publish
//
// The publish wizard's supply, composed from TWO faces because it asks two
// different questions:
//
//   - `items` — does this game already exist in the catalogue? A public dedup
//     search over every claimed work, published or not.
//   - `pending` — has the CALLER already submitted it? A private worklist, read
//     off the registry's per-user claim face.
//
// They were one upstream call while the wiki answered both from one index. The
// registry has no per-user dimension on a public search and should not grow
// one: merging a private worklist into a public search result is how a search
// face ends up leaking whose submission is whose.
//
// The caller's own block is filtered here rather than upstream: the per-user
// face has no text query, and a person's open submissions are a handful of
// rows, so asking for all of them and matching the name locally costs one small
// request and keeps the two supplies independent.
type wizardPendingHit struct {
	ID          int    `json:"id"`
	DisplayName string `json:"display_name"`
	ClaimState  string `json:"claim_state"`
	Reason      string `json:"reason,omitempty"`
}

func (h *PatchHandler) SearchGalgameForPublish(c fiber.Ctx) error {
	q := c.Query("q", "")
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	if limit < 1 || limit > 24 {
		limit = 10
	}
	items, total, err := h.galgame.SearchPublishItems(c.Context(), q, limit)
	if err != nil {
		if werr, ok := err.(*galgameClient.GalgameError); ok {
			return response.Error(c, errors.New(werr.Code, werr.Message, fiber.StatusBadRequest))
		}
		return response.Error(c, errors.ErrInternal("调用 Galgame 资料库失败"))
	}
	// Pre-sized non-nil: a nil slice marshals to JSON `null`, which crashes the
	// frontend's `results.pending.length`.
	pending := make([]wizardPendingHit, 0)
	if h.catalog != nil && h.catalog.Configured() {
		pending = append(pending, h.ownPendingSubmissions(c, q)...)
	}
	return response.OK(c, fiber.Map{"items": items, "pending": pending, "total": total})
}

// ownPendingSubmissions lists the caller's open submissions whose name matches
// the query. A failure degrades to an empty block with a warning rather than
// failing the search: the dedup half is what prevents a duplicate submission,
// and losing it to an unrelated upstream blip is the expensive outcome.
func (h *PatchHandler) ownPendingSubmissions(c fiber.Ctx, q string) []wizardPendingHit {
	page, err := h.catalog.UserClaims(c.Context(), middleware.MustGetUser(c).ID,
		catalogclient.UserClaimFilter{
			Site: claimSite, ClaimStates: mySubmissionStates, Limit: 50,
		})
	if err != nil {
		slog.Warn("读取本人投稿列表失败，向导仅显示公开结果", "error", err)
		return nil
	}
	needle := strings.ToLower(strings.TrimSpace(q))
	out := make([]wizardPendingHit, 0, len(page.Items))
	for i := range page.Items {
		it := &page.Items[i]
		if needle != "" && !strings.Contains(strings.ToLower(it.DisplayName), needle) {
			continue
		}
		hit := wizardPendingHit{
			ID: int(it.WorkID), DisplayName: it.DisplayName, ClaimState: it.ClaimState,
		}
		if it.ProductWorkID != nil && *it.ProductWorkID > 0 {
			hit.ID = int(*it.ProductWorkID)
		}
		if it.LastReason != nil {
			hit.Reason = *it.LastReason
		}
		out = append(out, hit)
	}
	return out
}

// GetResourceFileHistory GET /api/patch/resource/:resourceId/history
//
// Public, privacy-safe view of one resource's file-replacement audit
// (when / who-role / why / old size + hash). Deliberately omits the old
// download links + s3 key — those stay behind the rate-limited /link endpoint.
// Lets any visitor (incl. anonymous) see a resource's change history.
func (h *PatchHandler) GetResourceFileHistory(c fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	var req dto.ResourceFileHistoryRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	items, total, gErr := h.service.GetResourceFileHistory(resourceID, req.Page, req.Limit)
	if gErr != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, items, total)
}

// GetResourceRevisions GET /api/patch/resource/:resourceId/revisions
//
// Public per-field edit history (diff) for one resource: each row is one edit
// with a list of {field, before, after}. Secret-free (see service). Lets any
// visitor see "language changed from X to Y", etc.
func (h *PatchHandler) GetResourceRevisions(c fiber.Ctx) error {
	resourceID, err := getIDParam(c, "resourceId")
	if err != nil {
		return response.Error(c, err.(*errors.AppError))
	}
	var req dto.ResourceFileHistoryRequest
	if err := utils.ParseQueryAndValidate(c, &req); err != nil {
		return response.Error(c, errors.ErrBadRequest(err.Error()))
	}
	items, total, gErr := h.service.GetResourceRevisions(resourceID, req.Page, req.Limit)
	if gErr != nil {
		return response.Error(c, errors.ErrInternal(""))
	}
	return response.Paginated(c, items, total)
}

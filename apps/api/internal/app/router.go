package app

import (
	"kun-galgame-patch-api/internal/middleware"
)

func (a *App) RegisterRoutes() {
	api := a.Fiber.Group("/api")

	auth := middleware.Auth(a.RDB, a.Config.OAuth)
	optionalAuth := middleware.OptionalAuth(a.RDB, a.Config.OAuth)
	adminAuth := middleware.RequireRole(3)
	_ = adminAuth // will be used in Phase 4

	// ===== Auth Routes =====
	authRoutes := api.Group("/auth")
	authRoutes.Post("/oauth/callback", a.AuthHandler.OAuthCallback)
	authRoutes.Post("/logout", a.AuthHandler.Logout)
	authRoutes.Get("/me", auth, a.AuthHandler.Me)
	authRoutes.Post("/forgot/send-code", a.AuthHandler.ForgotSendCode)
	authRoutes.Post("/forgot/reset", a.AuthHandler.ForgotReset)
	authRoutes.Post("/email/send-code", auth, a.AuthHandler.SendEmailCode)

	// ===== Patch Routes =====
	patchRoutes := api.Group("/patch")

	// Public / optional auth
	patchRoutes.Get("/duplicate", auth, a.PatchHandler.CheckDuplicate)
	patchRoutes.Get("/:id", optionalAuth, a.PatchHandler.GetPatch)
	patchRoutes.Get("/:id/detail", optionalAuth, a.PatchHandler.GetPatchDetail)
	patchRoutes.Get("/:id/comment", optionalAuth, a.PatchHandler.GetComments)
	patchRoutes.Get("/:id/resource", optionalAuth, a.PatchHandler.GetResources)
	patchRoutes.Get("/:id/contributor", a.PatchHandler.GetContributors)
	patchRoutes.Put("/:id/view", a.PatchHandler.IncrementView)
	patchRoutes.Get("/comment/:commentId/markdown", a.PatchHandler.GetCommentMarkdown)

	// Authenticated
	patchRoutes.Put("/:id", auth, a.PatchHandler.UpdatePatch)
	patchRoutes.Delete("/:id", auth, a.PatchHandler.DeletePatch)
	patchRoutes.Post("/:id/comment", auth, a.PatchHandler.CreateComment)
	patchRoutes.Put("/comment/:commentId", auth, a.PatchHandler.UpdateComment)
	patchRoutes.Delete("/comment/:commentId", auth, a.PatchHandler.DeleteComment)
	patchRoutes.Put("/comment/:commentId/like", auth, a.PatchHandler.ToggleCommentLike)
	patchRoutes.Post("/:id/resource", auth, a.PatchHandler.CreateResource)
	patchRoutes.Put("/resource/:resourceId", auth, a.PatchHandler.UpdateResource)
	patchRoutes.Delete("/resource/:resourceId", auth, a.PatchHandler.DeleteResource)
	patchRoutes.Put("/resource/:resourceId/disable", auth, a.PatchHandler.ToggleResourceDisable)
	patchRoutes.Put("/resource/:resourceId/download", a.PatchHandler.IncrementResourceDownload)
	patchRoutes.Put("/resource/:resourceId/like", auth, a.PatchHandler.ToggleResourceLike)
	patchRoutes.Put("/:id/favorite", auth, a.PatchHandler.ToggleFavorite)

	// ===== Common Routes =====
	api.Get("/home/random", a.PatchHandler.GetRandomPatch)

	// ===== User Routes =====
	userRoutes := api.Group("/user")

	// Authenticated settings
	userRoutes.Put("/username", auth, a.UserHandler.UpdateUsername)
	userRoutes.Put("/bio", auth, a.UserHandler.UpdateBio)
	userRoutes.Put("/password", auth, a.UserHandler.UpdatePassword)
	userRoutes.Put("/email", auth, a.UserHandler.UpdateEmail)
	userRoutes.Post("/check-in", auth, a.UserHandler.CheckIn)
	userRoutes.Get("/search", auth, a.UserHandler.SearchUsers)

	// Public user profiles
	userRoutes.Get("/:uid", optionalAuth, a.UserHandler.GetUserInfo)
	userRoutes.Get("/:uid/floating", a.UserHandler.GetUserFloating)
	userRoutes.Get("/:uid/patch", a.UserHandler.GetUserPatches)
	userRoutes.Get("/:uid/resource", a.UserHandler.GetUserResources)
	userRoutes.Get("/:uid/favorite", a.UserHandler.GetUserFavorites)
	userRoutes.Get("/:uid/comment", a.UserHandler.GetUserComments)
	userRoutes.Get("/:uid/contribute", a.UserHandler.GetUserContributions)
	userRoutes.Get("/:uid/follower", optionalAuth, a.UserHandler.GetFollowers)
	userRoutes.Get("/:uid/following", optionalAuth, a.UserHandler.GetFollowing)

	// Follow/Unfollow
	userRoutes.Put("/:uid/follow", auth, a.UserHandler.Follow)
	userRoutes.Delete("/:uid/follow", auth, a.UserHandler.Unfollow)

	// ===== Message Routes =====
	// TODO: Phase 4

	// ===== Admin Routes =====
	// TODO: Phase 4

	// ===== Metadata Routes =====
	// TODO: Phase 4

	// ===== Chat Routes =====
	// TODO: Phase 5
}

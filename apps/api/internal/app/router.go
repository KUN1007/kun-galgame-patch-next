package app

import (
	"kun-galgame-patch-api/internal/middleware"
)

func (a *App) RegisterRoutes() {
	api := a.Fiber.Group("/api")

	auth := middleware.Auth(a.RDB, a.Config.OAuth)
	optionalAuth := middleware.OptionalAuth(a.RDB, a.Config.OAuth)
	adminAuth := middleware.RequireRole(3)
	superAdminAuth := middleware.RequireRole(4)

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

	// ===== User Routes =====
	userRoutes := api.Group("/user")

	// Authenticated settings (must be before /:uid routes)
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
	msgRoutes := api.Group("/message", auth)
	msgRoutes.Get("/", a.MessageHandler.GetMessages)
	msgRoutes.Get("/unread", a.MessageHandler.GetUnreadTypes)
	msgRoutes.Post("/", a.MessageHandler.CreateMessage)
	msgRoutes.Put("/read", a.MessageHandler.MarkAsRead)

	// ===== Admin Routes =====
	adminRoutes := api.Group("/admin", auth, adminAuth)

	// Comments
	adminRoutes.Get("/comment", a.AdminHandler.GetComments)
	adminRoutes.Put("/comment/:id", a.AdminHandler.UpdateComment)
	adminRoutes.Delete("/comment/:id", a.AdminHandler.DeleteComment)

	// Resources
	adminRoutes.Get("/resource", a.AdminHandler.GetResources)
	adminRoutes.Put("/resource/:id", a.AdminHandler.UpdateResource)
	adminRoutes.Delete("/resource/:id", a.AdminHandler.DeleteResource)

	// Users
	adminRoutes.Get("/user", a.AdminHandler.GetUsers)
	adminRoutes.Put("/user/:uid", a.AdminHandler.UpdateUser)
	adminRoutes.Delete("/user/:uid", superAdminAuth, a.AdminHandler.DeleteUser)

	// Creator applications
	adminRoutes.Get("/creator", a.AdminHandler.GetCreatorApplications)
	adminRoutes.Put("/creator/:messageId/approve", a.AdminHandler.ApproveCreator)
	adminRoutes.Put("/creator/:messageId/decline", a.AdminHandler.DeclineCreator)

	// Settings
	adminRoutes.Get("/setting/comment-verify", a.AdminHandler.GetCommentVerify)
	adminRoutes.Put("/setting/comment-verify", a.AdminHandler.SetCommentVerify)
	adminRoutes.Get("/setting/creator-only", a.AdminHandler.GetCreatorOnly)
	adminRoutes.Put("/setting/creator-only", a.AdminHandler.SetCreatorOnly)
	adminRoutes.Get("/setting/register", a.AdminHandler.GetRegisterDisabled)
	adminRoutes.Put("/setting/register", a.AdminHandler.SetRegisterDisabled)

	// Stats & Logs
	adminRoutes.Get("/stats", a.AdminHandler.GetStats)
	adminRoutes.Get("/stats/sum", a.AdminHandler.GetStatsSum)
	adminRoutes.Get("/log", a.AdminHandler.GetLogs)

	// ===== Metadata Routes =====
	// Tags
	tagRoutes := api.Group("/tag")
	tagRoutes.Get("/", a.MetadataHandler.GetTags)
	tagRoutes.Get("/:id", a.MetadataHandler.GetTagByID)
	tagRoutes.Post("/", auth, a.MetadataHandler.CreateTag)
	tagRoutes.Get("/:id/patch", optionalAuth, a.MetadataHandler.GetPatchesByTag)
	tagRoutes.Post("/search", a.MetadataHandler.SearchTags)

	// Characters
	charRoutes := api.Group("/character")
	charRoutes.Get("/", a.MetadataHandler.GetCharacters)
	charRoutes.Get("/:id", a.MetadataHandler.GetCharByID)
	charRoutes.Post("/search", a.MetadataHandler.SearchCharacters)

	// Companies
	companyRoutes := api.Group("/company")
	companyRoutes.Get("/", a.MetadataHandler.GetCompanies)
	companyRoutes.Get("/:id", a.MetadataHandler.GetCompanyByID)
	companyRoutes.Post("/", auth, a.MetadataHandler.CreateCompany)
	companyRoutes.Get("/:id/patch", optionalAuth, a.MetadataHandler.GetPatchesByCompany)
	companyRoutes.Post("/search", a.MetadataHandler.SearchCompanies)

	// Persons
	personRoutes := api.Group("/person")
	personRoutes.Get("/", a.MetadataHandler.GetPersons)
	personRoutes.Get("/:id", a.MetadataHandler.GetPersonByID)
	personRoutes.Post("/search", a.MetadataHandler.SearchPersons)

	// Releases
	api.Get("/release", a.MetadataHandler.GetReleases)

	// ===== Common Routes =====
	api.Get("/home", a.CommonHandler.GetHome)
	api.Get("/home/random", a.PatchHandler.GetRandomPatch)
	api.Get("/galgame", a.CommonHandler.GetGalgameList)
	api.Get("/comment", a.CommonHandler.GetGlobalComments)
	api.Get("/resource", a.CommonHandler.GetGlobalResources)
	api.Get("/resource/:id", a.CommonHandler.GetResourceDetail)

	// Creator application
	api.Post("/apply", auth, a.CommonHandler.Apply)
	api.Get("/apply/status", auth, a.CommonHandler.GetApplyStatus)

	// External APIs
	api.Get("/hikari", a.CommonHandler.GetHikari)
	api.Get("/moyu/patch/has-patch", a.CommonHandler.GetMoyuHasPatch)
}

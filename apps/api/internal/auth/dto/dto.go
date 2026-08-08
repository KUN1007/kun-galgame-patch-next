package dto

type OAuthCallbackRequest struct {
	Code         string `json:"code" validate:"required"`
	CodeVerifier string `json:"code_verifier" validate:"required"`
}

type MeResponse struct {
	ID              int      `json:"id"`
	Sub             string   `json:"sub"`
	Roles           []string `json:"roles"`
	SiteRoles       []string `json:"site_roles"`
	Name            string   `json:"name"`
	Avatar          string   `json:"avatar"`
	AvatarImageHash string   `json:"avatar_image_hash"`
	Bio             string   `json:"bio"`
	Moemoepoint     int      `json:"moemoepoint"`
	DailyCheckIn    int      `json:"daily_check_in"`
	DailyImageCount int      `json:"daily_image_count"`
	DailyUploadSize int64    `json:"daily_upload_size"`
	FollowerCount   int      `json:"follower_count"`
	FollowingCount  int      `json:"following_count"`
}

package dto

type UpdateUsernameRequest struct {
	Username string `json:"username" validate:"required,min=1,max=17"`
}

type UpdateBioRequest struct {
	Bio string `json:"bio" validate:"required,min=1,max=107"`
}

type UpdatePasswordRequest struct {
	OldPassword string `json:"old_password" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=6,max=1007"`
}

type UpdateEmailRequest struct {
	Email string `json:"email" validate:"required,email"`
	Code  string `json:"code" validate:"required,len=6"`
}

type GetUserProfileRequest struct {
	Page  int `query:"page" validate:"min=1"`
	Limit int `query:"limit" validate:"min=1,max=20"`
}

type SearchUserRequest struct {
	Query string `query:"query" validate:"required,min=1,max=20"`
}

type UserInfoResponse struct {
	ID             int    `json:"id"`
	Name           string `json:"name"`
	Avatar         string `json:"avatar"`
	Bio            string `json:"bio"`
	Moemoepoint    int    `json:"moemoepoint"`
	Role           int    `json:"role"`
	FollowerCount  int    `json:"follower_count"`
	FollowingCount int    `json:"following_count"`
	RegisterTime   string `json:"register_time"`
	PatchCount     int64  `json:"patch_count"`
	ResourceCount  int64  `json:"resource_count"`
	CommentCount   int64  `json:"comment_count"`
	FavoriteCount  int64  `json:"favorite_count"`
	IsFollowed     bool   `json:"is_followed"`
}

package dto

// OAuthCallbackRequest OAuth 回调请求
type OAuthCallbackRequest struct {
	Code         string `json:"code" validate:"required"`
	CodeVerifier string `json:"code_verifier" validate:"required"`
}

// ForgotSendCodeRequest 忘记密码 - 发送验证码
type ForgotSendCodeRequest struct {
	Name string `json:"name" validate:"required"`
}

// ForgotResetRequest 忘记密码 - 重置密码
type ForgotResetRequest struct {
	Name             string `json:"name" validate:"required"`
	VerificationCode string `json:"verification_code" validate:"required,len=6"`
	NewPassword      string `json:"new_password" validate:"required,min=6,max=1007"`
	ConfirmPassword  string `json:"confirm_password" validate:"required,eqfield=NewPassword"`
}

// SendEmailCodeRequest 发送邮箱修改验证码
type SendEmailCodeRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// MeResponse 当前用户信息响应
type MeResponse struct {
	UID             int    `json:"uid"`
	Name            string `json:"name"`
	Avatar          string `json:"avatar"`
	Bio             string `json:"bio"`
	Moemoepoint     int    `json:"moemoepoint"`
	Role            int    `json:"role"`
	DailyCheckIn    int    `json:"daily_check_in"`
	DailyImageCount int    `json:"daily_image_count"`
	DailyUploadSize int    `json:"daily_upload_size"`
}

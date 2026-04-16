package dto

// OAuthCallbackRequest is the OAuth callback request
type OAuthCallbackRequest struct {
	Code         string `json:"code" validate:"required"`
	CodeVerifier string `json:"code_verifier" validate:"required"`
}

// ForgotSendCodeRequest is the request for forgot password - send verification code
type ForgotSendCodeRequest struct {
	Name string `json:"name" validate:"required"`
}

// ForgotResetRequest is the request for forgot password - reset password
type ForgotResetRequest struct {
	Name             string `json:"name" validate:"required"`
	VerificationCode string `json:"verification_code" validate:"required,len=6"`
	NewPassword      string `json:"new_password" validate:"required,min=6,max=1007"`
	ConfirmPassword  string `json:"confirm_password" validate:"required,eqfield=NewPassword"`
}

// SendEmailCodeRequest is the request for sending an email change verification code
type SendEmailCodeRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// MeResponse is the current user info response
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

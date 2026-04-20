export interface KunCaptchaImage {
  id: string
  data: string
  isWhiteHair: boolean
}

export interface AuthFormData {
  email: string
  password: string
}

export interface CaptchaResponse {
  images: KunCaptchaImage[]
  sessionId: string
}

export interface CaptchaVerifyRequest {
  sessionId: string
  selectedIds: string[]
}

export interface CaptchaVerifyResponse {
  success: boolean
  message: string
}

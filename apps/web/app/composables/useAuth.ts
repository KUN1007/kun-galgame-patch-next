// useAuth wraps the session-cookie auth surface exposed by apps/api.
//
// There is no JWT / access_token on the client — authentication is a
// server-held Redis session keyed by the httpOnly `kun_session` cookie set by
// POST /auth/oauth/callback. All methods here return the raw ApiResponse so
// callers can inspect code/message.
export const useAuth = () => {
  const api = useApi()
  const userStore = useUserStore()

  // OAuth callback: the frontend receives { code, code_verifier } from the
  // OAuth provider redirect and forwards them to the backend, which creates
  // the session cookie and returns the current user profile.
  const oauthCallback = async (code: string, code_verifier: string) => {
    const res = await api.post<UserState>('/auth/oauth/callback', {
      code,
      code_verifier
    })
    if (res.code === 0 && res.data) {
      userStore.setUser(res.data)
    }
    return res
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      userStore.logout()
      navigateTo('/auth/login')
    }
  }

  // Refresh the cached user profile from /auth/me. Returns null when the
  // session is gone / expired.
  const fetchUser = async () => {
    const res = await api.get<UserState>('/auth/me')
    if (res.code === 0 && res.data) {
      userStore.setUser(res.data)
      return res.data
    }
    return null
  }

  // ===== Forgot password (public) =====

  const forgotSendCode = (name: string) =>
    api.post('/auth/forgot/send-code', { name })

  const forgotReset = (
    name: string,
    verification_code: string,
    new_password: string,
    confirm_password: string
  ) =>
    api.post('/auth/forgot/reset', {
      name,
      verification_code,
      new_password,
      confirm_password
    })

  // ===== Email change (requires login) =====

  // Sends a 6-digit verification code to the NEW email address.
  const sendEmailChangeCode = (email: string) =>
    api.post('/auth/email/send-code', { email })

  // Commits the email change with the code the user received.
  const updateEmail = (email: string, code: string) =>
    api.put('/user/email', { email, code })

  // ===== Password change (requires login) =====

  const updatePassword = (old_password: string, new_password: string) =>
    api.put('/user/password', { old_password, new_password })

  return {
    user: computed(() => userStore.user),
    isLoggedIn: computed(() => userStore.isLoggedIn),
    isAdmin: computed(() => userStore.isAdmin),
    oauthCallback,
    logout,
    fetchUser,
    forgotSendCode,
    forgotReset,
    sendEmailChangeCode,
    updateEmail,
    updatePassword
  }
}

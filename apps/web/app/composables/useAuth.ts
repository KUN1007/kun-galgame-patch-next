export const useAuth = () => {
  const api = useApi()
  const userStore = useUserStore()

  const accessToken = useCookie('access_token', {
    maxAge: 60 * 15, // 15 minutes
    sameSite: 'lax',
  })

  // Note: refresh_token is managed by the backend as an httpOnly cookie.
  // We cannot read it from JS, which is the point — it's secure from XSS.

  const setAccessToken = (token: string) => {
    accessToken.value = token
  }

  const clearAuth = () => {
    accessToken.value = null
    userStore.clearUser()
  }

  const login = async (account: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', {
      account,
      password,
    })
    if (response.code === 0) {
      setAccessToken(response.data.access_token)
      userStore.setUser(response.data.user)
    }
    return response
  }

  const register = async (name: string, email: string, password: string) => {
    const response = await api.post<User>('/auth/register', {
      name,
      email,
      password,
    })
    return response
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearAuth()
      navigateTo('/auth/login')
    }
  }

  const refreshAccessToken = async () => {
    try {
      // Backend reads refresh_token from httpOnly cookie automatically
      const response = await api.post<RefreshResponse>('/auth/refresh')
      if (response.code === 0) {
        setAccessToken(response.data.access_token)
        return true
      }
    } catch {
      clearAuth()
    }
    return false
  }

  const fetchUser = async () => {
    if (!accessToken.value) {
      // No access token — try refreshing (httpOnly cookie may still be valid)
      const refreshed = await refreshAccessToken()
      if (!refreshed) return null
    }

    try {
      const response = await api.get<User>('/auth/me')
      if (response.code === 0) {
        userStore.setUser(response.data)
        return response.data
      }
    } catch {
      // Try to refresh token
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return fetchUser()
      }
    }
    return null
  }

  const forgotPassword = async (email: string) => {
    return api.post('/auth/password/forgot', { email })
  }

  const resetPassword = async (token: string, password: string) => {
    return api.post('/auth/password/reset', { token, password })
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    return api.put('/auth/password', {
      old_password: oldPassword,
      new_password: newPassword,
    })
  }

  const sendEmailChangeCode = async (newEmail: string) => {
    return api.post('/auth/email/send-code', { new_email: newEmail })
  }

  const changeEmail = async (code: string, newEmail: string) => {
    return api.put('/auth/email', { code, new_email: newEmail })
  }

  return {
    user: computed(() => userStore.user),
    isLoggedIn: computed(() => userStore.isLoggedIn),
    isAdmin: computed(() => userStore.isAdmin),
    login,
    register,
    logout,
    fetchUser,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    changePassword,
    sendEmailChangeCode,
    changeEmail,
  }
}

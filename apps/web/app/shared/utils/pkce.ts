// PKCE (Proof Key for Code Exchange) utility for OAuth 2.0 Authorization Code flow

const base64UrlEncode = (input: Uint8Array): string =>
  btoa(String.fromCharCode(...input))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(digest))
}

const generateState = (): string => {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

export const startOAuthLogin = async (): Promise<void> => {
  const config = useRuntimeConfig()
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = generateState()

  sessionStorage.setItem('oauth_code_verifier', codeVerifier)
  sessionStorage.setItem('oauth_state', state)

  const oauthServerUrl = config.public.oauthServerUrl
  const clientId = config.public.oauthClientId
  const redirectUri =
    config.public.oauthRedirectUri ||
    `${window.location.origin}/auth/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  })

  window.location.href = `${oauthServerUrl}/oauth/authorize?${params}`
}

export const verifyOAuthCallback = (): {
  code: string
  codeVerifier: string
} | null => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const returnedState = urlParams.get('state')
  const savedState = sessionStorage.getItem('oauth_state')

  if (!code || !returnedState || returnedState !== savedState) {
    return null
  }

  const codeVerifier = sessionStorage.getItem('oauth_code_verifier')
  if (!codeVerifier) {
    return null
  }

  sessionStorage.removeItem('oauth_state')
  sessionStorage.removeItem('oauth_code_verifier')

  return { code, codeVerifier }
}

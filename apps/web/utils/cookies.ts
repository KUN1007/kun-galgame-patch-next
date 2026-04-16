export const parseCookies = (cookieString: string) => {
  const cookiesKv: { [key: string]: string } = {}
  cookieString &&
    cookieString.split(';').forEach((cookie) => {
      const parts: string[] = cookie.split('=')
      if (parts.length) {
        cookiesKv[parts.shift()!.trim()] = decodeURI(parts.join('='))
      }
    })
  return cookiesKv
}

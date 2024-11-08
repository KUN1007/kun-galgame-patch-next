export const getRemoteIp = (headers: Record<string, string>): string => {
  const ipForwarded = () => {
    const ip = headers['x-forwarded-for']
    if (Array.isArray(ip)) {
      return ip[0]
    } else {
      return ip?.split(',')[0].trim()
    }
  }

  const xRealIp = headers['x-real-ip']
  const cfConnectingIp = headers['CF-Connecting-IP']

  return cfConnectingIp || ipForwarded() || xRealIp || ''
}

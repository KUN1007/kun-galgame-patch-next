export const isPatchPath = (pathname: string): boolean => {
  return /^\/patch\/\d+/.test(pathname)
}

export const isTagPath = (pathname: string): boolean => {
  return /^\/tag\/\d+/.test(pathname)
}

export const isCompanyPath = (pathname: string): boolean => {
  return /^\/company\/\d+/.test(pathname)
}

export const isUserPath = (pathname: string): boolean => {
  return /^\/user\/\d+/.test(pathname)
}

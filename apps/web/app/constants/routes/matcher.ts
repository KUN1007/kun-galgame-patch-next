export const isPatchPath = (pathname: string): boolean =>
  /^\/patch\/\d+/.test(pathname)

export const isTagPath = (pathname: string): boolean =>
  /^\/tag\/\d+/.test(pathname)

export const isCompanyPath = (pathname: string): boolean =>
  /^\/company\/\d+/.test(pathname)

export const isUserPath = (pathname: string): boolean =>
  /^\/user\/\d+/.test(pathname)

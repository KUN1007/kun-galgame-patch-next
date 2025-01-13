import { isPatchPath, isTagPath, isCompanyPath, isUserPath } from './matcher'
import { keyLabelMap } from './constants'
import { kunMoyuMoe } from '~/config/moyu-moe'
import type { KunBreadcrumbItem } from './constants'

type NextParams = Record<string, string | Array<string> | undefined>

export const getKunPathLabel = (pathname: string): string => {
  for (const key in keyLabelMap) {
    const regex = new RegExp(`^${key.replace(/\[id\]/g, '\\d+')}$`)
    if (regex.test(pathname)) {
      return keyLabelMap[key]
    }
  }

  return keyLabelMap[pathname]
}

export const createBreadcrumbItem = (
  pathname: string,
  params: NextParams
): KunBreadcrumbItem | null => {
  const label = getKunPathLabel(pathname)
  if (!label) {
    return null
  }

  const defaultItem: KunBreadcrumbItem = {
    key: pathname,
    label,
    href: pathname
  }

  const pageTitle = document.title
    .replace(` - ${kunMoyuMoe.titleShort}`, '')
    .replace(/\|.*$/, '')

  const pathHandlers: Record<
    string,
    { keyPrefix: string; hrefSuffix: string }
  > = {
    patch: { keyPrefix: `/patch/${params.id}`, hrefSuffix: `/introduction` },
    tag: { keyPrefix: `/tag/${params.id}`, hrefSuffix: '' },
    company: { keyPrefix: `/company/${params.id}`, hrefSuffix: '' },
    user: { keyPrefix: `/user/${params.id}`, hrefSuffix: `/resource` }
  }

  for (const [pathKey, { keyPrefix, hrefSuffix }] of Object.entries(
    pathHandlers
  )) {
    const isPath = {
      patch: isPatchPath,
      tag: isTagPath,
      company: isCompanyPath,
      user: isUserPath
    }[pathKey]

    if (isPath && isPath(pathname)) {
      return {
        ...defaultItem,
        key: keyPrefix,
        label: pageTitle,
        href: `${keyPrefix}${hrefSuffix}`
      }
    }
  }

  return defaultItem
}

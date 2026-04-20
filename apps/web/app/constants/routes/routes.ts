import { kunMoyuMoe } from '~/config/moyu-moe'
import { keyLabelMap, type KunBreadcrumbItem } from './constants'
import {
  isCompanyPath,
  isPatchPath,
  isTagPath,
  isUserPath
} from './matcher'

type NuxtParams = Record<string, string | string[] | undefined>

export const getKunPathLabel = (pathname: string): string => {
  for (const key in keyLabelMap) {
    const regex = new RegExp(`^${key.replace(/\[id\]/g, '\\d+')}$`)
    if (regex.test(pathname)) {
      return keyLabelMap[key]!
    }
  }
  return keyLabelMap[pathname] ?? ''
}

export const createBreadcrumbItem = (
  pathname: string,
  params: NuxtParams
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

  const pageTitle =
    typeof document !== 'undefined'
      ? document.title
          .replace(` - ${kunMoyuMoe.titleShort}`, '')
          .replace(/\|.*$/, '')
      : label

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
    const matcher = {
      patch: isPatchPath,
      tag: isTagPath,
      company: isCompanyPath,
      user: isUserPath
    }[pathKey]

    if (matcher && matcher(pathname)) {
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

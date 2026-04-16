import {
  KUN_VISUAL_NOVEL_PATCH_APP_ADDRESS,
  KUN_API_BASE_URL
} from '~/config/app'

type FetchOptions = {
  headers?: Record<string, string>
  query?: Record<string, string | number>
  body?: Record<string, unknown>
  formData?: FormData
}

// Go backend response envelope
interface GoApiResponse<T> {
  code: number
  message: string
  data: T
  total?: number
}

// Endpoints that have been migrated to the Go Fiber backend.
// During the migration period, only these routes go to Go; the rest go to Next.js.
const GO_API_PREFIXES = [
  '/auth/',
  '/user/',
  '/patch/',
  '/message/',
  '/admin/',
  '/tag/',
  '/character/',
  '/company/',
  '/person/',
  '/release',
  '/home/',
  '/galgame',
  '/comment',
  '/resource',
  '/apply',
  '/hikari',
  '/moyu/'
]

const isGoEndpoint = (url: string): boolean =>
  GO_API_PREFIXES.some((prefix) => url.startsWith(prefix))

const kunFetchRequest = async <T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  options?: FetchOptions
): Promise<T> => {
  try {
    const { headers = {}, query, body, formData } = options || {}

    const queryString = query
      ? '?' +
        Object.entries(query)
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
      : ''

    const baseUrl = isGoEndpoint(url)
      ? KUN_API_BASE_URL
      : KUN_VISUAL_NOVEL_PATCH_APP_ADDRESS
    const fullUrl = `${baseUrl}/api${url}${queryString}`

    const fetchOptions: RequestInit = {
      method,
      credentials: 'include',
      mode: 'cors',
      headers: {
        ...headers
      }
    }

    if (formData) {
      fetchOptions.body = formData
    } else if (body) {
      fetchOptions.body = JSON.stringify(body)
      ;(fetchOptions.headers as Record<string, string>)['Content-Type'] =
        'application/json'
    }

    const response = await fetch(fullUrl, fetchOptions)
    const res = await response.json()

    // Handle Go backend {code, message, data} envelope
    if (
      res !== null &&
      typeof res === 'object' &&
      'code' in res &&
      'message' in res
    ) {
      const apiRes = res as GoApiResponse<T>
      if (apiRes.code !== 0) {
        // Return error message string (backwards compatible with KunResponse<T>)
        return apiRes.message as unknown as T
      }
      return apiRes.data
    }

    // Legacy next-server response (direct data or error string)
    return res
  } catch (error) {
    console.error(`Kun Fetch error: ${error}`)
    throw error
  }
}

export const kunFetchGet = async <T>(
  url: string,
  query?: Record<string, string | number>
): Promise<T> => {
  return kunFetchRequest<T>(url, 'GET', { query })
}

export const kunFetchPost = async <T>(
  url: string,
  body?: Record<string, unknown>
): Promise<T> => {
  return kunFetchRequest<T>(url, 'POST', { body })
}

export const kunFetchPut = async <T>(
  url: string,
  body?: Record<string, unknown>
): Promise<T> => {
  return kunFetchRequest<T>(url, 'PUT', { body })
}

export const kunFetchDelete = async <T>(
  url: string,
  query?: Record<string, string | number>
): Promise<T> => {
  return kunFetchRequest<T>(url, 'DELETE', { query })
}

export const kunFetchFormData = async <T>(
  url: string,
  formData?: FormData
): Promise<T> => {
  if (!formData) {
    throw new Error('formData is required for kunFetchFormData')
  }
  return kunFetchRequest<T>(url, 'POST', { formData })
}

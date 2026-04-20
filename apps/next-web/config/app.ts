export const KUN_VISUAL_NOVEL_PATCH_APP_ADDRESS =
  process.env.NODE_ENV === 'production'
    ? `https://${process.env.NEXT_PUBLIC_KUN_PATCH_APP_ADDRESS_PROD_HOST}${process.env.NEXT_PUBLIC_KUN_PATCH_APP_ADDRESS_PROD_PORT ? `:${process.env.NEXT_PUBLIC_KUN_PATCH_APP_ADDRESS_PROD_PORT}` : ''}`
    : `http://${process.env.NEXT_PUBLIC_KUN_PATCH_APP_ADDRESS_DEV_HOST}${process.env.NEXT_PUBLIC_KUN_PATCH_APP_ADDRESS_DEV_PORT ? `:${process.env.NEXT_PUBLIC_KUN_PATCH_APP_ADDRESS_DEV_PORT}` : ''}`

// Go Fiber API backend address (for migrated endpoints)
// In production this will be the same origin via Nginx reverse proxy
export const KUN_API_BASE_URL =
  process.env.NEXT_PUBLIC_KUN_API_BASE_URL ||
  KUN_VISUAL_NOVEL_PATCH_APP_ADDRESS

export const KUN_SOCKET_IO_ROUTE = '/ws'

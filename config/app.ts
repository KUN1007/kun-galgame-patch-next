export const KUN_VISUAL_NOVEL_PATCH_APP_ADDRESS =
  process.env.NODE_ENV === 'production'
    ? `https://${process.env.NEXT_PUBLIC_KUN_PATCH_APP_ADDRESS_PROD_HOST}${process.env.NEXT_PUBLIC_KUN_PATCH_APP_ADDRESS_PROD_PORT ? `:${process.env.NEXT_PUBLIC_KUN_PATCH_APP_ADDRESS_PROD_PORT}` : ''}`
    : `http://${process.env.NEXT_PUBLIC_KUN_PATCH_APP_ADDRESS_DEV_HOST}${process.env.NEXT_PUBLIC_KUN_PATCH_APP_ADDRESS_DEV_PORT ? `:${process.env.NEXT_PUBLIC_KUN_PATCH_APP_ADDRESS_DEV_PORT}` : ''}`

export const KUN_SOCKET_IO_ROUTE = '/ws'

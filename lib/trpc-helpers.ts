const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''
  return process.env.KUN_PATCH_ADDRESS
}

export const getUrl = () => {
  return `${getBaseUrl()}/api/trpc`
}

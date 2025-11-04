export const VNDB_API = process.env.KUN_VNDB_API || 'https://api.vndb.org/kana'
export const BGM_API = process.env.KUN_BANGUMI_API || 'https://api.bgm.tv'

export function getBangumiAccessToken(): string | null {
  return process.env.KUN_BANGUMI_TOKEN || null
}

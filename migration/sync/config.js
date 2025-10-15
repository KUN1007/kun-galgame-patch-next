export const VNDB_API = 'https://api.vndb.org/kana'
export const BGM_API = 'https://api.bgm.tv'

export function getBangumiAccessToken() {
  return process.env.KUN_BANGUMI_TOKEN || ''
}

// Base endpoints for upstream APIs
export const VNDB_API = 'https://api.vndb.org/kana'
export const BGM_API = 'https://api.bgm.tv'

/**
 * Read Bangumi OAuth token from env.
 * Purpose: authorize requests to private-friendly endpoints (e.g., NSFW content).
 */
export function getBangumiAccessToken() {
  return process.env.KUN_BANGUMI_TOKEN || ''
}

/*
可优化的地方：
- 允许通过环境覆盖 API 基础 URL，便于沙箱/镜像切换；
- 提供一个集中配置对象，注入请求超时/重试等参数。
*/

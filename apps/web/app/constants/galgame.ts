export const GALGAME_AGE_LIMIT_MAP: Record<string, string> = {
  sfw: 'SFW',
  nsfw: 'NSFW'
}

export const GALGAME_AGE_LIMIT_DETAIL: Record<string, string> = {
  sfw: '本文章内容安全, 无 R18 等内容, 适合在公共场所浏览',
  nsfw: '本文章可能包含 R18 等内容, 不适合在公共场所浏览'
}

// The two galgame list pages sort over different data: /galgame ranks moyu's own
// patch rows, /gallib ranks catalog works and has no patch columns to rank by.
export const GALGAME_SORT_FIELD_LABEL_MAP: Record<string, string> = {
  resource_update_time: '补丁更新时间',
  // `created` is the patch ROW's creation timestamp (when the entry was added
  // to moyu), not when the game was made — hence "条目创建时间", not "游戏…".
  created: '条目创建时间',
  view: '浏览量',
  download: '下载量',
  // 按游戏发售日期排序（本地镜像 patch.release_date，wiki §17）。
  release_date: '发售日期'
}

export const GALGAME_LIBRARY_SORT_FIELD_LABEL_MAP: Record<string, string> = {
  popularity: '热度',
  release_date: '发售日期',
  updated: '资料更新时间'
}

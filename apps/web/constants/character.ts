export const ROLE_LABELS: Record<string, string> = {
  protagonist: '主角',
  main: '可攻略',
  side: '配角',
  supporting: '配角',
  appears: '出场',
  director: '导演',
  producer: '制作人',
  scenario: '剧本',
  programming: '程序',
  chardesign: '人设',
  artist: '美术',
  art: '美术',
  music: '音乐',
  sound: '音效',
  composer: '作曲',
  lyricist: '作词',
  arrange: '编曲',
  singer: '歌手',
  voice: '配音',
  songs: '主题歌',
  staff: '工作人员',
  translator: '翻译人',
  qa: '质量保证',
  other: '其他'
}

export const ROLE_ORDER_CHARACTER: string[] = [
  'protagonist',
  'main',
  'supporting',
  'side',
  'appears',
  'voice'
]

export const ROLE_ORDER_PERSON: string[] = [
  'director',
  'producer',
  'scenario',
  'programming',
  'chardesign',
  'artist',
  'art',
  'music',
  'sound',
  'composer',
  'lyricist',
  'arrange',
  'singer',
  'voice',
  'other'
]

export function roleLabel(role: string): string {
  const k = String(role || '').trim()
  return ROLE_LABELS[k] || k || '其他'
}

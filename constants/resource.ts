export const SUPPORTED_TYPES = [
  '人工翻译补丁',
  'AI 翻译补丁',
  '机翻润色',
  '机翻补丁',
  '全 CG 存档',
  '破解补丁',
  '修正补丁',
  '魔改补丁',
  '其它'
]

export const ALL_SUPPORTED_TYPES = ['全部类型', ...SUPPORTED_TYPES]

export const SUPPORTED_LANGUAGES = [
  '简体中文',
  '繁體中文',
  '日本語',
  'English',
  '其它'
]

export const SUPPORTED_PLATFORMS = [
  'Windows',
  'Android',
  'MacOS',
  'iOS',
  'Linux',
  '其它'
]

export const SUPPORTED_RESOURCE_LINK = ['s3', 'onedrive', 'user']

export const SUPPORTED_RESOURCE_LINK_MAP: Record<string, string> = {
  s3: '对象存储下载',
  onedrive: 'OneDrive 下载',
  user: '自定义链接下载'
}

export const ALLOWED_MIME_TYPES = [
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed'
]

export const ALLOWED_EXTENSIONS = ['.zip', '.rar', '.7z']

export const SUPPORTED_TYPE = [
  'manual',
  'ai',
  'machine_polishing',
  'machine',
  'save',
  'crack',
  'fix',
  'mod',
  'other'
]

export const SUPPORTED_TYPE_MAP: Record<string, string> = {
  all: '全部类型',
  manual: '人工翻译补丁',
  ai: 'AI 翻译补丁',
  machine_polishing: '机翻润色',
  machine: '机翻补丁',
  save: '全 CG 存档',
  crack: '破解补丁',
  fix: '修正补丁',
  mod: '魔改补丁',
  other: '其它'
}

export const ALL_SUPPORTED_TYPE = ['all', ...SUPPORTED_TYPE]

export const SUPPORTED_LANGUAGE = ['zh-Hans', 'zh-Hant', 'ja', 'en', 'other']

export const SUPPORTED_LANGUAGE_MAP: Record<string, string> = {
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
  ja: '日本語',
  en: 'English',
  other: '其它'
}

export const SUPPORTED_PLATFORM = [
  'windows',
  'android',
  'macos',
  'ios',
  'linux',
  'other'
]

export const SUPPORTED_PLATFORM_MAP: Record<string, string> = {
  windows: 'Windows',
  android: 'Android',
  macos: 'MacOS',
  ios: 'iOS',
  linux: 'Linux',
  other: '其它'
}

export const SUPPORTED_RESOURCE_LINK = ['s3', 'onedrive', 'user']

export const SUPPORTED_RESOURCE_LINK_MAP: Record<string, string> = {
  s3: '对象存储下载',
  onedrive: 'OneDrive 下载',
  user: '自定义链接下载'
}

export const ALLOWED_MIME_TYPES = [
  'application/zip',
  'application/x-lz4',
  'application/x-rar-compressed',
  'application/x-7z-compressed'
]

export const ALLOWED_EXTENSIONS = ['.zip', '.rar', '.7z', '.lz4']

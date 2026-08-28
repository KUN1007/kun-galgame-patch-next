export const SUPPORTED_TYPE = [
  'manual',
  'ai',
  'machine_polishing',
  'machine',
  'save',
  'crack',
  'fix',
  'mod',
  'r18',
  'decensor',
  'image',
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
  r18: 'R18 成人内容补丁',
  decensor: '去马赛克补丁',
  image: '修图补丁',
  other: '其它'
}

export const ALL_SUPPORTED_TYPE = ['all', ...SUPPORTED_TYPE]

// The galgame card's poster corner is ~40% of a 150px-wide cover, so it labels
// the patch types with these instead of SUPPORTED_TYPE_MAP's full names.
export const SUPPORTED_TYPE_SHORT_MAP: Record<string, string> = {
  manual: '汉化',
  ai: 'AI',
  machine_polishing: '润色',
  machine: '机翻',
  save: '存档',
  crack: '破解',
  fix: '修正',
  mod: '魔改',
  r18: 'R18',
  decensor: '去码',
  image: '修图',
  other: '其它'
}

export const resourceTypes = [
  {
    value: 'manual',
    label: '人工翻译补丁',
    description:
      '从制作开始到制作结束, 完全由人工进行, 无大范围 AI, 翻译器等参与的翻译补丁, 允许 5% 的 AI 翻译文本阈值'
  },
  {
    value: 'ai',
    label: 'AI 翻译补丁',
    description:
      '由 Sakura, Claude 3.5 Sonnet, GPT 4.0, DeepSeek-V2 等, 现代 AI 大语言模型参与翻译的补丁'
  },
  {
    value: 'machine_polishing',
    label: '机翻润色',
    description:
      '我们允许 5% 的机器翻译文本阈值, 任何超过这个阈值的翻译补丁都算作机翻润色补丁'
  },
  {
    value: 'machine',
    label: '机翻补丁',
    description:
      '某些旧时代非 AI 机翻的机器翻译补丁, 例如使用 VNR JBeijing7 等辞书进行离线机翻产生的机翻补丁'
  },
  {
    value: 'save',
    label: '全 CG 存档',
    description:
      '包括对 Galgame CG, 剧情解锁后生成的存档文件, savedata 数据等, 以供解锁 Galgame CG 和剧情'
  },
  {
    value: 'crack',
    label: '破解补丁',
    description: '免 CD 补丁, 免认证补丁, 脱壳补丁等'
  },
  {
    value: 'fix',
    label: '修正补丁',
    description:
      '游戏发售完成后, 官方可能会发放游戏修正补丁, 用来修复 BUG, 修正演出效果等'
  },
  {
    value: 'mod',
    label: '魔改补丁',
    description:
      '由 Cheat Engine 或者其它工具, 或者自行修改游戏资源数据, 对官方游戏内容, 玩法等产生变更, 产生的补丁'
  },
  {
    value: 'r18',
    label: 'R18 成人内容补丁',
    description:
      '为全年龄版 / 移植版游戏追加或解锁 R18 成人向内容 (成人 CG, 剧情, 事件等) 的补丁'
  },
  {
    value: 'decensor',
    label: '去马赛克补丁',
    description:
      '去除游戏 CG 或演出画面中的马赛克遮挡, 还原无修正 (无码) 画面的补丁'
  },
  {
    value: 'image',
    label: '修图补丁',
    description:
      '替换或修改游戏图片资源的补丁, 例如修正官方 CG, 立绘, 背景的错误, 汉化 / 本地化界面与图片内的文字, 或提升分辨率, 改善图片显示效果等'
  },
  {
    value: 'other',
    label: '其它',
    description:
      '除了 Galgame 游戏资源本体, Galgame 游戏 R18 内容补丁之外的, 没有提到的补丁种类'
  }
]

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

export const storageTypes = [
  {
    value: 's3',
    label: '平台托管',
    description:
      '上传到鲲补丁站，稳定、永不失效过期，CDN 加速下载，支持断点续传'
  },
  {
    value: 'user',
    label: '自定义链接',
    description:
      '网盘 / 外链等，适合超出上传上限的超大文件，需自行提供并维护下载链接'
  }
]

export const SUPPORTED_RESOURCE_LINK_MAP: Record<string, string> = {
  s3: '平台托管下载',
  user: '自定义链接下载'
}

export const ALLOWED_EXTENSIONS = ['.zip', '.rar', '.7z']

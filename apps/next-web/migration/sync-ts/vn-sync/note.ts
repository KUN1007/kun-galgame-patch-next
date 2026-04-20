import { readFile } from 'fs/promises'

export interface NoteContext {
  company: string
  gameName: string
  groupName: string
  language: 'zh-Hans' | 'zh-Hant'
  publishDate: string
  startDate?: string
  vndbId: string
  platform: 'windows' | 'other'
  fileName?: string
}

// Try to replace placeholders in the template like {会社名}, {游戏名}, {汉化组}, {汉化发布日期}, {语言}, {VNDB}, {平台}
export function renderNoteFromTemplate(template: string, ctx: NoteContext) {
  const pairs: Array<[RegExp, string]> = [
    /{[^}]*会社[^}]*}/, // company (JP word)
    /{[^}]*公司[^}]*}/ // company (CN word)
  ].map((rx) => [rx as RegExp, ctx.company]) as any

  const more: Array<[RegExp, string]> = [
    [/{[^}]*游戏[^}]*}/, ctx.gameName],
    [/{[^}]*汉化组[^}]*}/, ctx.groupName],
    [/{[^}]*组名[^}]*}/, ctx.groupName],
    [/{[^}]*开坑[^}]*}/, ctx.startDate || ''],
    [/{[^}]*开始[^}]*}/, ctx.startDate || ''],
    [/{[^}]*起始[^}]*}/, ctx.startDate || ''],
    [/{[^}]*发布日期[^}]*}/, ctx.publishDate],
    [/{[^}]*语言[^}]*}/, ctx.language],
    [/{[^}]*VNDB[^}]*}/i, ctx.vndbId],
    [/{[^}]*平台[^}]*}/, ctx.platform],
    [/{[^}]*文件名[^}]*}/, ctx.fileName || '']
  ]

  let out = template
  for (const [rx, val] of [...(pairs as any), ...more]) {
    out = out.replace(rx, val)
  }
  return out
}

export async function loadNoteTemplate() {
  const buf = await readFile('migration/sync-ts/vn-sync/note.md')
  return buf.toString('utf8')
}

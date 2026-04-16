import { loadNoteTemplate, renderNoteFromTemplate } from '../note'

async function main() {
  const tpl = await loadNoteTemplate()
  const example = renderNoteFromTemplate(tpl, {
    company: 'ensemble',
    gameName: '乙女シリーズ 女装主人公ミニゲーム New stage 2',
    groupName: '雨樱未来个人汉化',
    language: 'zh-Hans',
    startDate: '20211126',
    publishDate: '20230705',
    vndbId: 'v31700',
    platform: 'windows'
  })
  console.log(example)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

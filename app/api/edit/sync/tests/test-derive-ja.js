const VNDB_API = process.env.KUN_VNDB_API || 'https://api.vndb.org/kana'

const pickJapaneseTitle = (vn) => {
  let nameJa = ''
  try {
    const titles = Array.isArray(vn?.titles) ? vn.titles : []
    const jaItem = titles.find((t) => String(t?.lang || '').toLowerCase().split('-')[0] === 'ja')
    if (jaItem?.title) nameJa = String(jaItem.title)
    if (!nameJa) {
      const ol = String(vn?.olang || '').toLowerCase()
      const alt = vn?.alttitle || ''
      if (ol === 'ja' && alt) nameJa = String(alt)
    }
  } catch {}
  return nameJa
}

;(async () => {
  const body = {
    filters: ['id', '=', 'v19658'],
    fields: 'id, title, alttitle, olang, titles{lang,title,latin,official,main}'
  }
  const res = await fetch(`${VNDB_API}/vn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  const vn = data?.results?.[0]
  console.log('Derived JA:', pickJapaneseTitle(vn || {}))
})().catch((e) => {
  console.error(e)
  process.exit(1)
})

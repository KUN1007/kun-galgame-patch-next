import { fs, path } from './utils.js'

export async function loadVndbTagMap() {
  let tagMap = {}
  try {
    const tagMapPath = path.join(process.cwd(), 'lib', 'tagMap.ts')
    const src = await fs.readFile(tagMapPath, 'utf8')
    const match = src.match(/TAG_MAP\s*:\s*Record<[^>]+>\s*=\s*\{[\s\S]*\}\s*$/)
    if (match) {
      let objCode = match[0]
      objCode = objCode.replace(/^.*?=\s*/s, '')
      objCode = objCode.replace(/;\s*$/, '')
      objCode = objCode.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '\n')
      // eslint-disable-next-line no-new-func
      tagMap = Function('return (' + objCode + ')')()
    }
  } catch {}
  return tagMap
}

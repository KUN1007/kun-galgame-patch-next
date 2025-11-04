import { fs, path } from './utils.js'

/**
 * Load VNDB tag translations from TypeScript source (lib/tagMap.ts).
 * Purpose: provide an EN->ZH mapping to localize VNDB tags in our UI/DB.
 * Implementation details:
 * - Naively parse the TAG_MAP Record from source as a JS object literal;
 * - Removes trailing comments and semicolons; executed in a sandboxed Function.
 */
export async function loadVndbTagMap() {
  let tagMap = {}
  try {
    const tagMapPath = path.join(process.cwd(), 'lib', 'tagMap.ts')
    const src = await fs.readFile(tagMapPath, 'utf8')
    const match = src.match(/TAG_MAP\s*:\s*Record<[^>]+>\s*=\s*\{[\s\S]*\}\s*$/)
    if (match) {
      let objCode = match[0]
      // Strip type + assignment
      objCode = objCode.replace(/^.*?=\s*/s, '')
      // Strip trailing semicolon
      objCode = objCode.replace(/;\s*$/, '')
      // Remove line comments conservatively
      objCode = objCode.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '\n')
      // eslint-disable-next-line no-new-func
      tagMap = Function('return (' + objCode + ')')()
    }
  } catch {}
  return tagMap
}

/*
可优化的地方：
- 使用 ts-node/esm 真正解析并导入 TS 文件，避免字符串解析脆弱性；
- 将映射预编译为 JSON 并随构建产出，加快运行期解析。
*/

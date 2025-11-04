import { prisma } from './dbClient.js'
import { clearLegacyTables } from './db.js'
import { processPatch } from './processPatch.js'
import { getBangumiAccessToken } from './config.js'
import { sleep } from './utils.js'
import { lowercaseVndbId } from './lowercaseVndbId.js'

// Keep original behavior: print token and enforce presence
console.log(process.env.KUN_BANGUMI_TOKEN)
if (!getBangumiAccessToken()) {
  throw new Error('process.env.KUN_BANGUMI_TOKEN not found')
}

/**
 * Entry point: sync all patches via VNDB + Bangumi, end-to-end.
 * Steps:
 * 1) Clear legacy tables (fresh run)
 * 2) Normalize local VNDB ids (if needed)
 * 3) Iterate all patches and process sequentially
 */
async function main() {
  console.log('Clearing legacy tables...')
  await clearLegacyTables()
  await lowercaseVndbId()

  const patches = await prisma.patch.findMany({})
  console.log(`Found ${patches.length} patches`)

  for (let i = 0; i < patches.length; i++) {
    const p = patches[i]
    console.log(
      `[${i + 1}/${patches.length}] Processing patch ${p.id} - ${p.name}`
    )
    try {
      // Process a single patch: VNDB → Bangumi → Persist
      await processPatch(p)
    } catch (e) {
      console.error('processPatch error:', e?.message || e)
    }
    // Gentle pacing within rate limits
    await sleep(600)
  }
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

/*
可优化的地方：
- 支持仅处理指定 patchId / 范围 / 随机样本的命令行开关；
- 引入并发池（受限于 API 速率）来缩短总耗时；
- 输出结构化日志与错误报告，便于复盘与二次同步。
*/

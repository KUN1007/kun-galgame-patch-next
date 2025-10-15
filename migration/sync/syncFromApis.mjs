import { prisma } from './dbClient.js'
import { clearLegacyTables } from './db.js'
import { processPatch } from './processPatch.js'
import { getBangumiAccessToken } from './config.js'
import { sleep } from './utils.js'

// Keep original behavior: print token and enforce presence
console.log(process.env.KUN_BANGUMI_TOKEN)
if (!getBangumiAccessToken()) {
  throw new Error('process.env.KUN_BANGUMI_TOKEN not found')
}

async function main() {
  console.log('Clearing legacy tables...')
  await clearLegacyTables()

  const patches = await prisma.patch.findMany({})
  console.log(`Found ${patches.length} patches`)

  for (let i = 0; i < patches.length; i++) {
    const p = patches[i]
    console.log(
      `[${i + 1}/${patches.length}] Processing patch ${p.id} - ${p.name}`
    )
    try {
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

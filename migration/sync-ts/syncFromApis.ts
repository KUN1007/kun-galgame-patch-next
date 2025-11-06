import { prisma } from './db/prisma'
import { clearLegacyTables, lowercaseVndbIdSafely } from './db/helpers'
import { processPatch } from './processPatch'

const SYNC_CONCURRENCY = 5

async function main() {
  await clearLegacyTables()
  await lowercaseVndbIdSafely()
  const patches = await prisma.patch.findMany({})
  console.log(
    `Starting sync for ${patches.length} patches with concurrency=${SYNC_CONCURRENCY}`
  )

  // Simple concurrency runner: process in batches
  let done = 0
  for (let i = 0; i < patches.length; i += SYNC_CONCURRENCY) {
    const batch = patches.slice(i, i + SYNC_CONCURRENCY)
    await Promise.all(
      batch.map(async (p, idx) => {
        const seq = i + idx + 1
        console.log(`[${seq}/${patches.length}] sync patch ${p.id} - ${p.name}`)
        try {
          await processPatch(p)
        } catch (e: any) {
          console.error(
            `processPatch error for ${p.id} - ${p.name}:`,
            e?.message || e
          )
        } finally {
          done++
        }
      })
    )
  }
  console.log(`All done: processed ${done}/${patches.length}`)
}

main()
  .catch((e) => {
    console.error('syncFromApis failed:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

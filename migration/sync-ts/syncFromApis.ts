import { prisma } from './db/prisma'
import { clearLegacyTables, lowercaseVndbIdSafely } from './db/helpers'
import { processPatch } from './processPatch'

async function main() {
  await clearLegacyTables()
  await lowercaseVndbIdSafely()
  const patches = await prisma.patch.findMany({})
  for (let i = 0; i < patches.length; i++) {
    const p = patches[i]
    console.log(`[${i + 1}/${patches.length}] sync patch ${p.id} - ${p.name}`)
    try {
      await processPatch(p)
    } catch (e: any) {
      console.error('processPatch error:', e?.message || e)
    }
  }
}

main()
  .catch((e) => {
    console.error('syncFromApis failed:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

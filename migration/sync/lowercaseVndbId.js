import { prisma } from './dbClient.js'

async function main() {
  const patches = await prisma.patch.findMany({
    where: {
      NOT: { vndb_id: null }
    },
    select: { id: true, vndb_id: true }
  })

  let updated = 0
  for (const p of patches) {
    const lower = p.vndb_id.toLowerCase()
    if (p.vndb_id !== lower) {
      try {
        await prisma.patch.update({
          where: { id: p.id },
          data: { vndb_id: lower }
        })
        updated++
        console.log(`✅ Updated patch ${p.id}: ${p.vndb_id} → ${lower}`)
      } catch (err) {
        console.warn(`⚠️ Failed to update patch ${p.id}:`, err.message)
      }
    }
  }

  console.log(`🎉 Done! Updated ${updated} patches.`)
}

export const lowercaseVndbId = async () => {
  await main()
    .catch((e) => {
      console.error('❌ Error in script:', e)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

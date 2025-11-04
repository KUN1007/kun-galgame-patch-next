import { prisma } from './dbClient.js'

async function main() {
  const patches = await prisma.patch.findMany({
    where: { NOT: { vndb_id: null } },
    select: { id: true, vndb_id: true }
  })

  let updated = 0
  for (const p of patches) {
    const lower = String(p.vndb_id || '').toLowerCase()
    if (p.vndb_id !== lower) {
      try {
        const conflict = await prisma.patch.findFirst({
          where: { vndb_id: lower },
          select: { id: true }
        })
        if (conflict && conflict.id !== p.id) {
          await prisma.patch.update({
            where: { id: p.id },
            data: { vndb_id: null }
          })
          console.warn(
            `lowercaseVndbId: skip patch ${p.id}, lowercase '${lower}' already used by patch ${conflict.id}; set current vndb_id to null`
          )
        } else {
          await prisma.patch.update({
            where: { id: p.id },
            data: { vndb_id: lower }
          })
          updated++
          console.log(
            `lowercaseVndbId: updated patch ${p.id}: ${p.vndb_id} -> ${lower}`
          )
        }
      } catch (err) {
        console.warn(
          `lowercaseVndbId: failed to update patch ${p.id}:`,
          err?.message || err
        )
      }
    }
  }

  console.log(`lowercaseVndbId: done, updated ${updated} patches.`)
}

export const lowercaseVndbId = async () => {
  await main()
    .catch((e) => {
      console.error('lowercaseVndbId error:', e)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

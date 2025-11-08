import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Delete orphan characters and persons that are not linked to any patch or voice relation.
export const cleanupOrphans = async () => {
  // Orphan characters: no patch_char_relation and no patch_char_person_relation
  const orphanChars = await prisma.patch_char.findMany({
    where: {
      AND: [{ patches: { none: {} } }, { voices: { none: {} } }]
    },
    select: { id: true }
  })
  if (orphanChars.length) {
    const ids = orphanChars.map((c) => c.id)
    await prisma.patch_char
      .deleteMany({ where: { id: { in: ids } } })
      .catch(() => {})
  }

  // Orphan persons: no patch_person_relation and no patch_char_person_relation
  const orphanPersons = await prisma.patch_person.findMany({
    where: {
      AND: [{ patches: { none: {} } }, { chars: { none: {} } }]
    },
    select: { id: true }
  })
  if (orphanPersons.length) {
    const ids = orphanPersons.map((p) => p.id)
    await prisma.patch_person
      .deleteMany({ where: { id: { in: ids } } })
      .catch(() => {})
  }

  await prisma.$disconnect()
}

// If executed directly: preview and execute when EXECUTE=1
if (require.main === module) {
  ;(async () => {
    const countBeforeChars = await prisma.patch_char.count({
      where: { AND: [{ patches: { none: {} } }, { voices: { none: {} } }] }
    })
    const countBeforePersons = await prisma.patch_person.count({
      where: { AND: [{ patches: { none: {} } }, { chars: { none: {} } }] }
    })
    console.log('Orphan patch_char:', countBeforeChars)
    console.log('Orphan patch_person:', countBeforePersons)
    if (process.env.EXECUTE === '1') {
      await cleanupOrphans()
      console.log('Orphan cleanup executed.')
    } else {
      console.log('Dry run. Set EXECUTE=1 to execute deletion.')
      await prisma.$disconnect()
    }
  })().catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
}

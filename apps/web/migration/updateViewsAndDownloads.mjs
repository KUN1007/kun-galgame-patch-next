import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function triangularRandom(min, mode, max) {
  const u = Math.random()
  const c = (mode - min) / (max - min)
  if (u < c) {
    return min + Math.sqrt(u * (max - min) * (mode - min))
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode))
  }
}

function triangularRandomInt(min, mode, max) {
  const v = triangularRandom(min, mode, max)
  const n = Math.round(v)
  if (n < min) return min
  if (n > max) return max
  return n
}

async function updatePatchViews() {
  const MIN = 300
  const MODE = 1500
  const MAX = 10000

  const targets = await prisma.patch.findMany({
    where: { view: { lt: 100 } },
    select: { id: true }
  })

  let count = 0
  for (const p of targets) {
    const newViews = triangularRandomInt(MIN, MODE, MAX)
    await prisma.patch.update({
      where: { id: p.id },
      data: { view: newViews }
    })
    count++
    if (count % 200 === 0)
      console.log(`Updated patch views: ${count}/${targets.length}`)
  }

  console.log(
    `Done: updated ${count} patch views (<100) to [${MIN}, ${MAX}] around ${MODE}.`
  )
}

async function updateResourceDownloads() {
  const MIN = 30
  const MODE = 300
  const MAX = 3000

  // Apply analogous condition: update only low current counts.
  const targets = await prisma.patch_resource.findMany({
    where: { download: { lt: 30 } },
    select: { id: true }
  })

  let count = 0
  for (const r of targets) {
    const newDownloads = triangularRandomInt(MIN, MODE, MAX)
    await prisma.patch_resource.update({
      where: { id: r.id },
      data: { download: newDownloads }
    })
    count++
    if (count % 200 === 0)
      console.log(`Updated resource downloads: ${count}/${targets.length}`)
  }

  console.log(
    `Done: updated ${count} resource downloads (<30) to [${MIN}, ${MAX}] around ${MODE}.`
  )
}

async function main() {
  try {
    await updatePatchViews()
    await updateResourceDownloads()
  } catch (e) {
    console.error('Error updating views/downloads:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()

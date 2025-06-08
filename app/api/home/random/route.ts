import { NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'

export const getRandomPatchId = async () => {
  const totalArticles = await prisma.patch.findMany({
    select: { id: true }
  })
  if (totalArticles.length === 0) {
    return '未查询到 Galgame'
  }
  const ids = totalArticles.map((a) => a.id)
  const randomIndex = Math.floor(Math.random() * ids.length)

  return { id: ids[randomIndex] }
}

export const GET = async () => {
  const response = await getRandomPatchId()
  return NextResponse.json(response)
}

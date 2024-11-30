import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { searchTagSchema } from '~/validations/tag'

export const searchTag = async (input: z.infer<typeof searchTagSchema>) => {
  const { query } = input

  const tags = await Promise.all(
    query.map(async (q) =>
      prisma.patch_tag.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { alias: { has: q } }
          ]
        },
        select: {
          id: true,
          name: true,
          count: true,
          alias: true
        },
        orderBy: { count: 'desc' },
        take: 100
      })
    )
  )

  return tags.flat()
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, searchTagSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await searchTag(input)
  return NextResponse.json(response)
}

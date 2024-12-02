import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { getTagByIdSchema } from '~/validations/tag'
import type { TagDetail } from '~/types/api/tag'

export const getTagById = async (input: z.infer<typeof getTagByIdSchema>) => {
  const { tagId } = input

  const tag: TagDetail | null = await prisma.patch_tag.findUnique({
    where: { id: tagId },
    select: {
      id: true,
      name: true,
      count: true,
      alias: true,
      introduction: true,
      created: true
    }
  })
  if (!tag) {
    return '未找到标签'
  }

  return tag
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getTagByIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getTagById(input)
  return NextResponse.json(response)
}

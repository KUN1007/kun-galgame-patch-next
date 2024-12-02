import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePutBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { createTagSchema, updateTagSchema } from '~/validations/tag'
import type { TagDetail } from '~/types/api/tag'

export const createTag = async (input: z.infer<typeof createTagSchema>) => {
  const { name, introduction = '', alias = [] } = input

  const existingTag = await prisma.patch_tag.findFirst({
    where: {
      OR: [{ name }, { alias: { has: name } }]
    }
  })
  if (existingTag) {
    return '这个标签已经存在了'
  }

  const newTag = await prisma.patch_tag.create({
    data: {
      name,
      introduction,
      alias
    },
    select: {
      id: true,
      name: true,
      count: true,
      alias: true
    }
  })

  return newTag
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, createTagSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await createTag(input)
  return NextResponse.json(response)
}

export const rewriteTag = async (input: z.infer<typeof updateTagSchema>) => {
  const { tagId, name, introduction = '', alias = [] } = input

  const existingTag = await prisma.patch_tag.findFirst({
    where: {
      OR: [{ name }, { alias: { has: name } }]
    }
  })
  if (existingTag) {
    return '这个标签已经存在了'
  }

  const newTag: TagDetail = await prisma.patch_tag.update({
    where: { id: tagId },
    data: {
      name,
      introduction,
      alias
    }
  })

  return newTag
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, updateTagSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await rewriteTag(input)
  return NextResponse.json(response)
}

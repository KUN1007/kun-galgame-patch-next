import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody, kunParsePutBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { patchTagChangeSchema } from '~/validations/patch'

export const handleAddPatchTag = async (
  input: z.infer<typeof patchTagChangeSchema>,
  uid: number
) => {
  const { patchId, tagId } = input

  const tags = await prisma.patch_tag.findMany({
    where: { id: { in: tagId } },
    select: { name: true }
  })
  const tagsNameArray = tags.map((t) => t.name)

  return await prisma.$transaction(async (prisma) => {
    const relationData = tagId.map((id) => ({
      patch_id: patchId,
      tag_id: id
    }))
    await prisma.patch_tag_relation.createMany({
      data: relationData
    })

    await prisma.patch_tag.updateMany({
      where: { id: { in: tagId } },
      data: { count: { increment: 1 } }
    })

    await prisma.patch_history.create({
      data: {
        action: '增加了',
        type: '标签',
        content: tagsNameArray.toString(),
        user_id: uid,
        patch_id: patchId
      }
    })
  })
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, patchTagChangeSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await handleAddPatchTag(input, payload.uid)
  return NextResponse.json(response)
}

export const handleRemovePatchTag = async (
  input: z.infer<typeof patchTagChangeSchema>,
  uid: number
) => {
  const { patchId, tagId } = input

  const tags = await prisma.patch_tag.findMany({
    where: { id: { in: tagId } },
    select: { name: true }
  })
  const tagsNameArray = tags.map((t) => t.name)

  return await prisma.$transaction(async (prisma) => {
    await prisma.patch_tag_relation.deleteMany({
      where: {
        patch_id: patchId,
        tag_id: { in: tagId }
      }
    })

    await prisma.patch_tag.updateMany({
      where: { id: { in: tagId } },
      data: { count: { increment: -1 } }
    })

    await prisma.patch_history.create({
      data: {
        action: '删除了',
        type: '标签',
        content: tagsNameArray.toString(),
        user_id: uid,
        patch_id: patchId
      }
    })
  })
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, patchTagChangeSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await handleRemovePatchTag(input, payload.uid)
  return NextResponse.json(response)
}

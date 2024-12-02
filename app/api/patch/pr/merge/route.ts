import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePutBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { createDedupMessage } from '~/app/api/utils/message'
import type { PatchUpdate } from '~/types/api/patch'

const prIdSchema = z.object({
  prId: z.coerce.number({ message: '补丁 ID 必须为数字' }).min(1).max(9999999)
})

export const mergePullRequest = async (
  input: z.infer<typeof prIdSchema>,
  uid: number
) => {
  const pullRequest = await prisma.patch_pull_request.findUnique({
    where: { id: input.prId }
  })
  if (!pullRequest) {
    return '未找到这个更新请求'
  }

  const patch = await prisma.patch.findUnique({
    where: { id: pullRequest.patch_id }
  })
  const user = await prisma.user.findUnique({ where: { id: uid } })
  if (patch?.user_id !== uid && user!.role < 3) {
    return '您没有权限合并更新请求'
  }

  const updates = JSON.parse(pullRequest.content) as PatchUpdate

  return await prisma.$transaction(async (prisma) => {
    await prisma.patch.update({
      where: { id: pullRequest.patch_id },
      data: {
        name: updates.name,
        introduction: updates.introduction,
        alias: updates.alias
      }
    })

    await prisma.patch_pull_request.update({
      where: { id: input.prId },
      data: {
        complete_time: String(Date.now()),
        diff_content: '',
        content: '',
        status: 1
      }
    })

    await prisma.patch_history.create({
      data: {
        action: 'merge',
        type: 'pr',
        content: `#${pullRequest.index}`,
        user_id: uid,
        patch_id: pullRequest.patch_id
      }
    })

    if (pullRequest.user_id !== uid) {
      await createDedupMessage({
        type: 'pr',
        content: '合并了您的更新请求!',
        sender_id: uid,
        recipient_id: pullRequest.user_id,
        patch_id: pullRequest.patch_id
      })
    }

    const contribute = await prisma.user_patch_contribute_relation.findFirst({
      where: { user_id: pullRequest.user_id, patch_id: pullRequest.patch_id }
    })
    if (!contribute) {
      await prisma.user_patch_contribute_relation.create({
        data: { user_id: pullRequest.user_id, patch_id: pullRequest.patch_id }
      })
    }

    return {}
  })
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, prIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await mergePullRequest(input, payload.uid)
  return NextResponse.json(response)
}

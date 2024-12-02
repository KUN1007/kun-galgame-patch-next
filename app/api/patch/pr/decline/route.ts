import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePutBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { declinePullRequestSchema } from '~/validations/patch'
import { createDedupMessage } from '~/app/api/utils/message'

export const declinePullRequest = async (
  input: z.infer<typeof declinePullRequestSchema>,
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
    return '您没有权限拒绝更新请求'
  }

  return await prisma.$transaction(async (prisma) => {
    await prisma.patch_pull_request.update({
      where: { id: input.prId },
      data: {
        complete_time: String(Date.now()),
        diff_content: '',
        content: '',
        status: 2,
        note: input.note
      }
    })

    await prisma.patch_history.create({
      data: {
        action: '拒绝了',
        type: '更新请求',
        content: `#${pullRequest.index}`,
        user_id: uid,
        patch_id: pullRequest.patch_id
      }
    })

    await createDedupMessage({
      type: 'pr',
      content: `拒绝了您的更新请求... 理由: ${input.note}`,
      sender_id: uid,
      recipient_id: pullRequest.user_id,
      patch_id: pullRequest.patch_id
    })

    return {}
  })
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, declinePullRequestSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await declinePullRequest(input, payload.uid)
  return NextResponse.json(response)
}

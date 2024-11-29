import { adminProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import {
  adminPaginationSchema,
  agreeCreatorSchema,
  declineCreatorSchema
} from '~/validations/admin'
import { createMessage } from '~/server/utils/message'
import type { AdminCreator } from '~/types/api/admin'

export const getCreator = adminProcedure
  .input(adminPaginationSchema)
  .query(async ({ ctx, input }) => {
    const { page, limit } = input
    const offset = (page - 1) * limit

    const [data, total] = await Promise.all([
      await prisma.user_message.findMany({
        where: { type: 'apply' },
        take: limit,
        skip: offset,
        orderBy: { created: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }),
      await prisma.user_message.count()
    ])

    const creators: AdminCreator[] = data.map((creator) => ({
      id: creator.id,
      content: creator.content,
      status: creator.status,
      sender: creator.sender
    }))

    return { creators, total }
  })

export const agreeCreator = adminProcedure
  .input(agreeCreatorSchema)
  .query(async ({ ctx, input }) => {
    const { messageId } = input
    const message = await prisma.user_message.findUnique({
      where: { id: messageId }
    })
    if (!message) {
      return '未找到该创作者请求'
    }

    return prisma.$transaction(async (prisma) => {
      await prisma.user_message.update({
        where: { id: messageId },
        // status: 0 - unread, 1 - read, 2 - agree, 3 - decline
        data: { status: { set: 2 } }
      })

      await createMessage({
        type: 'apply',
        content: '恭喜! 您的创作者申请已经通过!',
        recipient_id: message.sender_id ?? undefined
      })
    })
  })

export const declineCreator = adminProcedure
  .input(declineCreatorSchema)
  .query(async ({ ctx, input }) => {
    const { messageId, reason } = input
    const message = await prisma.user_message.findUnique({
      where: { id: messageId }
    })
    if (!message) {
      return '未找到该创作者请求'
    }

    return prisma.$transaction(async (prisma) => {
      await prisma.user_message.update({
        where: { id: messageId },
        // status: 0 - unread, 1 - read, 2 - agree, 3 - decline
        data: { status: { set: 3 } }
      })

      await createMessage({
        type: 'apply',
        content: `您的创作者申请被拒绝, 理由: ${reason}`,
        recipient_id: message.sender_id ?? undefined
      })
    })
  })

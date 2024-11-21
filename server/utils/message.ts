import { router, privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { createMessageSchema, getMessageSchema } from '~/validations/message'
import { MESSAGE_TYPE } from '~/constants/message'

interface CreateMessageType {
  type: (typeof MESSAGE_TYPE)[number]
  content: string
  sender_id: number
  recipient_id: number
  patch_id?: number
  patch_resource_id?: number
  comment_id?: number
}

export const createMessage = async (data: CreateMessageType) => {
  const message = await prisma.user_message.create({
    data
  })
  return message
}

export const messageRouter = router({
  createMessage: privateProcedure
    .input(createMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const { type, content, recipientId, patchId, resourceId, commentId } =
        input

      const message = await createMessage({
        type,
        content,
        sender_id: ctx.uid,
        recipient_id: recipientId,
        patch_id: patchId,
        patch_resource_id: resourceId,
        comment_id: commentId
      })

      return message
    }),

  getMessage: privateProcedure
    .input(getMessageSchema)
    .query(async ({ ctx, input }) => {
      const { type, page, limit } = input
      const offset = (page - 1) * limit

      const where = type
        ? {
            recipient_id: ctx.uid,
            type
          }
        : { recipient_id: ctx.uid }

      const [messages, total] = await Promise.all([
        prisma.user_message.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { created: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.user_message.count({ where })
      ])

      return { messages, total }
    })
})

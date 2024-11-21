import { prisma } from '~/prisma/index'
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

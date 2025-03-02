import { prisma } from '~/prisma/index'
import { MESSAGE_TYPE } from '~/constants/message'

interface CreateMessageType {
  type: (typeof MESSAGE_TYPE)[number]
  content: string
  link: string
  sender_id?: number
  recipient_id?: number
}

export const createMessage = async (data: CreateMessageType) => {
  const message = await prisma.user_message.create({
    data
  })
  return message
}

export const createDedupMessage = async (data: CreateMessageType) => {
  const duplicatedMessage = await prisma.user_message.findFirst({
    where: {
      ...data
    }
  })
  if (duplicatedMessage) {
    return
  }

  const message = createMessage(data)

  return message
}

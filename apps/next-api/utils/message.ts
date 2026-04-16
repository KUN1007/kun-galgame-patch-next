import { prisma } from '~/prisma/index'
import type { CreateMessageType } from '~/types/api/message'

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

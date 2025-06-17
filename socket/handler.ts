import { Server, Socket } from 'socket.io'
import { prisma } from '~/prisma/index'
import { registerChatEventHandlers } from './event/register'

export const onSocketConnection = async (io: Server, socket: Socket) => {
  try {
    const userId = Number(socket.handshake.query.userId)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatar: true }
    })

    if (!user) {
      throw new Error('Invalid user ID.')
    }

    socket.data.user = user

    const memberships = await prisma.chat_member.findMany({
      where: { user_id: user.id },
      select: { chat_room_id: true }
    })
    memberships.forEach((m) => socket.join(`room:${m.chat_room_id}`))

    registerChatEventHandlers(io, socket)

    socket.on('disconnect', () => {
      // console.log(`- Socket disconnected: ${socket.id} (User: ${user.name})`)
    })
  } catch (error: any) {
    console.error(`! Socket connection failed: ${error.message}`)
    socket.disconnect()
  }
}

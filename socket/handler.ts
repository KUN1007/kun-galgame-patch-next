import { Server, Socket } from 'socket.io'
import { prisma } from '~/prisma/index'
import { registerChatEventHandlers } from './event/register'
import { broadcastRoomStatus } from './event/roomStatus' // 1. 引入辅助函数

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

    const roomIds = memberships.map((m) => m.chat_room_id)
    socket.data.roomIds = roomIds

    roomIds.forEach((roomId) => {
      socket.join(`room:${roomId}`)
    })

    roomIds.forEach((roomId) => {
      broadcastRoomStatus(io, roomId)
    })

    registerChatEventHandlers(io, socket)

    socket.on('disconnect', () => {
      console.log(`- Socket disconnected: ${socket.id} (User: ${user.name})`)
      const roomsToUpdate = socket.data.roomIds as number[] | undefined

      if (roomsToUpdate) {
        roomsToUpdate.forEach((roomId) => {
          broadcastRoomStatus(io, roomId)
        })
      }
    })
  } catch (error: unknown) {
    console.error(`! Socket connection failed: ${error}`)
    socket.disconnect()
  }
}

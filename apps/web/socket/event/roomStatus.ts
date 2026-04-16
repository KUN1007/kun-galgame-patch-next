import { Server } from 'socket.io'
import { KUN_CHAT_EVENT } from '~/constants/chat'

const getOnlineCountInRoom = (io: Server, roomId: number): number => {
  const roomName = `room:${roomId}`
  const sockets = io.sockets.adapter.rooms.get(roomName)
  return sockets ? sockets.size : 0
}

export const broadcastRoomStatus = (io: Server, roomId: number) => {
  const onlineCount = getOnlineCountInRoom(io, roomId)
  const roomName = `room:${roomId}`

  io.to(roomName).emit(KUN_CHAT_EVENT.ROOM_STATUS_UPDATE, {
    roomId,
    onlineCount
  })
}

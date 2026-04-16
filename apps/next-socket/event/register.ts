import { Server, Socket } from 'socket.io'
import { KUN_CHAT_EVENT } from '~/constants/chat'
import {
  handleSendMessage,
  handleDeleteMessage,
  handleEditMessage
} from './chatMessage'
import { handleToggleReaction } from './reaction'
import { handleMessageSeen } from './seen'
import { handleUserTyping } from './typing'

export const registerChatEventHandlers = (io: Server, socket: Socket) => {
  socket.on(KUN_CHAT_EVENT.SEND_MESSAGE, (data) =>
    handleSendMessage(io, socket, data)
  )

  socket.on(KUN_CHAT_EVENT.DELETE_MESSAGE, (data) =>
    handleDeleteMessage(io, socket, data)
  )

  socket.on(KUN_CHAT_EVENT.EDIT_MESSAGE, (data) =>
    handleEditMessage(io, socket, data)
  )

  socket.on(KUN_CHAT_EVENT.TOGGLE_REACTION, (data) =>
    handleToggleReaction(io, socket, data)
  )

  socket.on(KUN_CHAT_EVENT.MESSAGE_SEEN, (data) =>
    handleMessageSeen(io, socket, data)
  )

  socket.on(KUN_CHAT_EVENT.USER_TYPING, (data) =>
    handleUserTyping(io, socket, data)
  )
}

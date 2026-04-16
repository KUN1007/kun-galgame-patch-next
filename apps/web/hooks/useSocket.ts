// hooks/useSocket.ts
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { KUN_SOCKET_IO_ROUTE } from '~/config/app'

export const useSocket = (userId: number | null) => {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (!userId) {
      return
    }

    const newSocket = io({
      path: KUN_SOCKET_IO_ROUTE,
      query: { userId }
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [userId])

  return socket
}

// hooks/useSocket.ts
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export const useSocket = (userId: number | null) => {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (!userId) {
      return
    }

    const newSocket = io({
      path: '/api/socket',
      query: { userId }
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [userId])

  return socket
}

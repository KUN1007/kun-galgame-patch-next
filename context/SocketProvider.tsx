'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
})

export const useSocket = () => {
  return useContext(SocketContext)
}

export const SocketProvider = ({
  children,
  userId
}: {
  children: React.ReactNode
  userId: number | undefined
}) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!userId) {
      return
    }

    const socketInstance = io({
      path: '/api/socket',
      query: { userId }
      // addTrailingSlash: false,
    })

    socketInstance.on('connect', () => {
      console.log('Socket.IO: Connected')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket.IO: Disconnected')
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [userId])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

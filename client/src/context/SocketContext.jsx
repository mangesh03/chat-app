import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null)
    const { token } = useAuth()

    useEffect(() => {
        if (!token) return
        if (socket) return

        const newSocket = io(BACKEND_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        })

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id)
        })

        setSocket(newSocket)

        return () => {
            newSocket.disconnect()
        }
    }, [token])

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => useContext(SocketContext)
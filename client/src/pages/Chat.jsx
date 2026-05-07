import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import MessageInput from '../components/MessageInput'
import API from '../api/axios'
import toast from 'react-hot-toast'

const Chat = () => {
  const { user } = useAuth()
  const { socket } = useSocket()

  const [rooms, setRooms] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [typingUser, setTypingUser] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({})
  const [showSidebar, setShowSidebar] = useState(true)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await API.get('/rooms')
        setRooms(data)
      } catch (err) {
        toast.error('Failed to load rooms')
      }
    }
    fetchRooms()
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on('receive-message', (message) => {
      setMessages((prev) => [...prev, message])
      if (message.sender?.name !== user?.name) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.room]: (prev[message.room] || 0) + 1
        }))
        toast(`${message.sender?.name}: ${message.content}`, { icon: '💬' })
      }
    })

    socket.on('typing', ({ userName }) => {
      if (userName !== user?.name) setTypingUser(userName)
    })

    socket.on('stop-typing', () => setTypingUser(null))

    socket.on('user-online', ({ userName, onlineUsers }) => {
      setOnlineUsers(onlineUsers)
      if (userName && userName !== user?.name) {
        toast(`${userName} joined`, { icon: '🟢' })
      }
    })

    socket.on('user-offline', ({ onlineUsers }) => {
      setOnlineUsers(onlineUsers)
    })

    return () => {
      socket.off('receive-message')
      socket.off('typing')
      socket.off('stop-typing')
      socket.off('user-online')
      socket.off('user-offline')
    }
  }, [socket, user])

  const handleRoomSelect = async (room) => {
    setCurrentRoom(room)
    setMessages([])
    setTypingUser(null)
    setUnreadCounts((prev) => ({ ...prev, [room._id]: 0 }))
    setShowSidebar(false)

    socket.emit('join-room', {
      roomId: room._id,
      userId: user.id,
      userName: user.name
    })

    try {
      const { data } = await API.get(`/rooms/${room._id}/messages`)
      setMessages(data)
    } catch (err) {
      toast.error('Failed to load messages')
    }
  }

  const handleCreateRoom = async () => {
    const name = prompt('Enter room name:')
    if (!name?.trim()) return
    try {
      const { data } = await API.post('/rooms', {
        name: name.trim(),
        description: `${name} room`
      })
      setRooms((prev) => [data, ...prev])
      toast.success(`Room #${data.name} created!`)
      handleRoomSelect(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room')
    }
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex`}>
        <Sidebar
          rooms={rooms}
          currentRoom={currentRoom}
          onRoomSelect={handleRoomSelect}
          onCreateRoom={handleCreateRoom}
          onlineUsers={onlineUsers}
          unreadCounts={unreadCounts}
        />
      </div>

      <div className={`${!showSidebar ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-hidden`}>
        <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(true)}
            className="md:hidden text-gray-500 hover:text-gray-800 font-bold text-xl"
          >
            ☰
          </button>
          {currentRoom ? (
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800"># {currentRoom.name}</h2>
                <p className="text-xs text-gray-500">{currentRoom.description || 'No description'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs text-gray-500">{onlineUsers.length} online</span>
              </div>
            </div>
          ) : (
            <h2 className="font-semibold text-gray-400">Select a room</h2>
          )}
        </div>

        <ChatWindow
          messages={messages}
          typingUser={typingUser}
          currentRoom={currentRoom}
        />
        <MessageInput currentRoom={currentRoom} />
      </div>
    </div>
  )
}

export default Chat
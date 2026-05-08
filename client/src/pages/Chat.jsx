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
  const [users, setUsers] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [typingUser, setTypingUser] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({})
  const [showSidebar, setShowSidebar] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, usersRes] = await Promise.all([
          API.get('/rooms'),
          API.get('/rooms/users/list')
        ])
        setRooms(roomsRes.data)
        setUsers(usersRes.data)
      } catch (err) {
        toast.error('Failed to load data')
      }
    }
    fetchData()

    const interval = setInterval(async () => {
      try {
        const { data } = await API.get('/rooms/users/list')
        setUsers(data)
      } catch (err) { }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on('receive-message', (message) => {
      // Only show in chat window if message belongs to current room
      setMessages((prev) => {
        if (currentRoom && message.room === currentRoom._id) {
          return [...prev, message]
        }
        return prev
      })

      // Don't count own messages
      if (message.sender?.name === user?.name) return

      // Show badge and toast only if NOT in that room right now
      const isCurrentRoom = currentRoom?._id === message.room
      if (!isCurrentRoom) {
        // For DM — also add badge on sender's user ID
        // For group — badge on room ID
        setUnreadCounts((prev) => {
          const newCounts = {
            ...prev,
            [message.room]: (prev[message.room] || 0) + 1  // group room badge
          }
          // Also add badge on sender ID for DM list
          if (message.sender?._id) {
            newCounts[message.sender._id] = (prev[message.sender._id] || 0) + 1
          }
          return newCounts
        })

        toast(`💬 ${message.sender?.name}: ${message.content}`, {
          duration: 4000
        })
      }
    })

    socket.on('typing', ({ userName }) => {
      if (userName !== user?.name) setTypingUser(userName)
    })

    socket.on('stop-typing', () => setTypingUser(null))

    socket.on('user-online', ({ userName, onlineUsers }) => {
      setOnlineUsers(onlineUsers)
      if (userName && userName !== user?.name) {
        toast(`🟢 ${userName} is online`)
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
  }, [socket, user, currentRoom])

  const handleRoomSelect = async (room) => {
    setCurrentRoom(room)
    setMessages([])
    setTypingUser(null)
    setShowSidebar(false)

    // Clear room badge
    setUnreadCounts((prev) => ({
      ...prev,
      [room._id]: 0
    }))

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

  const handleDMSelect = async (selectedUser) => {
    try {
      const { data } = await API.post(`/rooms/dm/${selectedUser._id}`)

      // Clear unread badge for this user when opening DM
      setUnreadCounts((prev) => ({
        ...prev,
        [selectedUser._id]: 0
      }))

      handleRoomSelect(data)
    } catch (err) {
      toast.error('Failed to open DM')
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

  const getRoomDisplayName = () => {
    if (!currentRoom) return ''
    if (currentRoom.type === 'direct') {
      const otherUser = users.find(u =>
        currentRoom.name?.includes(u.name)
      )
      return `@ ${otherUser?.name || currentRoom.name}`
    }
    return `# ${currentRoom.name}`
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex`}>
        <Sidebar
          rooms={rooms}
          users={users}
          currentRoom={currentRoom}
          onRoomSelect={handleRoomSelect}
          onDMSelect={handleDMSelect}
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
                <h2 className="font-semibold text-gray-800">
                  {getRoomDisplayName()}
                </h2>
                <p className="text-xs text-gray-500">
                  {currentRoom.type === 'direct'
                    ? 'Direct Message'
                    : currentRoom.description || 'No description'}
                </p>
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
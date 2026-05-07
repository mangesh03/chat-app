import { useState, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'

const MessageInput = ({ currentRoom }) => {
  const [message, setMessage] = useState('')
  const { socket } = useSocket()
  const { user } = useAuth()
  const typingTimeoutRef = useRef(null)

  const handleSend = () => {
    if (!message.trim() || !currentRoom || !socket) return

    socket.emit('send-message', {
      roomId: currentRoom._id,
      content: message.trim(),
      senderId: user.id,
      senderName: user.name
    })

    socket.emit('stop-typing', { roomId: currentRoom._id })
    setMessage('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTyping = (e) => {
    setMessage(e.target.value)
    if (!currentRoom || !socket) return

    socket.emit('typing', { roomId: currentRoom._id, userName: user.name })

    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { roomId: currentRoom._id })
    }, 1500)
  }

  const charCount = message.length
  const isOverLimit = charCount > 500

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border transition-colors ${
        isOverLimit
          ? 'bg-red-50 border-red-300'
          : 'bg-gray-100 border-transparent focus-within:bg-white focus-within:border-indigo-300'
      }`}>
        <input
          type="text"
          value={message}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder={currentRoom ? `Message #${currentRoom.name}...` : 'Select a room first'}
          disabled={!currentRoom}
          maxLength={500}
          className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400 disabled:cursor-not-allowed"
        />
        {charCount > 400 && (
          <span className={`text-xs flex-shrink-0 ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
            {500 - charCount}
          </span>
        )}
        <button
          onClick={handleSend}
          disabled={!message.trim() || !currentRoom || isOverLimit}
          className="bg-indigo-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
        >
          Send
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1 ml-1">Press Enter to send · Max 500 chars</p>
    </div>
  )
}

export default MessageInput
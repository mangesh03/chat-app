import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

const ChatWindow = ({ messages, typingUser, currentRoom }) => {
  const { user } = useAuth()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUser])

  if (!currentRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-medium text-gray-600">Select a room to start chatting</p>
          <p className="text-sm mt-1">Or create a new room from the sidebar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
      {messages.length === 0 && (
        <div className="text-center text-gray-400 text-sm mt-8">
          No messages yet. Say hello! 👋
        </div>
      )}

      {messages.map((msg, index) => {
        if (!msg || !msg.sender) return null

        const senderId = msg.sender._id || msg.sender.id || msg.sender
        const isMe = senderId?.toString() === user?.id?.toString()
        const senderName = msg.sender.name || 'Unknown'

        return (
          <div key={msg._id || index} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
              style={{ background: isMe ? '#6366f1' : '#64748b' }}
            >
              {senderName.slice(0, 2).toUpperCase()}
            </div>
            <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
              {!isMe && (
                <span className="text-xs text-gray-500 mb-1 ml-1">{senderName}</span>
              )}
              <div
                className={`px-3 py-2 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
              <span className="text-xs text-gray-400 mt-1 mx-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )
      })}

      {typingUser && (
        <div className="flex items-center gap-2 text-gray-500 text-xs">
          <div className="bg-white border border-gray-200 rounded-full px-3 py-2 flex gap-1">
            <span className="animate-bounce">•</span>
            <span className="animate-bounce" style={{ animationDelay: '0.15s' }}>•</span>
            <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>•</span>
          </div>
          <span>{typingUser} is typing...</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

export default ChatWindow
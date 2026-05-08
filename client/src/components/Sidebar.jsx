import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Sidebar = ({ rooms, users, currentRoom, onRoomSelect, onDMSelect, onCreateRoom, onlineUsers, unreadCounts }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getInitials = (name) => name?.slice(0, 2).toUpperCase() || '??'
  const isOnline = (userName) => onlineUsers.some(u => u.userName === userName)

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full flex-shrink-0">

      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold">C</div>
          <div>
            <h1 className="font-semibold text-sm">ChatApp</h1>
            <p className="text-gray-400 text-xs">Hey, {user?.name} 👋</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">

        {/* Rooms */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Rooms</span>
            <button
              onClick={onCreateRoom}
              className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 text-lg leading-none transition-colors"
            >+</button>
          </div>
          <div className="space-y-0.5">
            {rooms.map((room) => (
              <button
                key={room._id}
                onClick={() => onRoomSelect(room)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors
                  ${currentRoom?._id === room._id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'}`}
              >
                <span className="text-gray-400">#</span>
                <span className="truncate flex-1">{room.name}</span>
                {unreadCounts?.[room._id] > 0 && currentRoom?._id !== room._id && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 animate-pulse">
                    {unreadCounts[room._id]}
                  </span>
                )}
              </button>
            ))}
            {rooms.length === 0 && (
              <p className="text-gray-500 text-xs text-center mt-2">No rooms yet. Click + to create!</p>
            )}
          </div>
        </div>

        {/* Direct Messages */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Direct Messages</span>
          </div>
          <div className="space-y-0.5">
            {users.map((u) => {
              const unread = unreadCounts?.[u._id] || 0
              const isActive = currentRoom?.type === 'direct' && currentRoom?.name?.includes(u.name)

              return (
                <button
                  key={u._id}
                  onClick={() => onDMSelect(u)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors
                    ${isActive
                      ? 'bg-indigo-600 text-white'
                      : unread > 0
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800'}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-medium">
                      {getInitials(u.name)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${isOnline(u.name) ? 'bg-green-400' : 'bg-gray-500'
                      }`}></div>
                  </div>
                  <span className="truncate flex-1 font-medium">{u.name}</span>
                  {unread > 0 && !isActive && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 animate-pulse">
                      {unread}
                    </span>
                  )}
                </button>
              )
            })}
            {users.length === 0 && (
              <p className="text-gray-500 text-xs text-center mt-2">No other users yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700">
        <div
          className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-gray-800 cursor-pointer"
          onClick={handleLogout}
        >
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-medium">
            {getInitials(user?.name)}
          </div>
          <span className="text-xs text-gray-300 flex-1 truncate">{user?.name}</span>
          <span className="text-xs text-gray-500 hover:text-red-400 transition-colors">Sign out</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
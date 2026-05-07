import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Sidebar = ({ rooms, currentRoom, onRoomSelect, onCreateRoom, onlineUsers, unreadCounts }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getInitials = (name) => name?.slice(0, 2).toUpperCase() || '??'

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full flex-shrink-0">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold">
            C
          </div>
          <div>
            <h1 className="font-semibold text-sm">ChatApp</h1>
            <p className="text-gray-400 text-xs">Hey, {user?.name} 👋</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Rooms
          </span>
          <button
            onClick={onCreateRoom}
            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 text-lg leading-none transition-colors"
            title="Create room"
          >
            +
          </button>
        </div>

        <div className="space-y-0.5">
          {rooms.map((room) => (
            <button
              key={room._id}
              onClick={() => onRoomSelect(room)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors
                ${currentRoom?._id === room._id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
                }`}
            >
              <span className="text-gray-400 text-base">#</span>
              <span className="truncate flex-1">{room.name}</span>
              {unreadCounts?.[room._id] > 0 && currentRoom?._id !== room._id && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {unreadCounts[room._id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {rooms.length === 0 && (
          <p className="text-gray-500 text-xs text-center mt-6 px-2">
            No rooms yet.<br />Click + to create one!
          </p>
        )}
      </div>

      <div className="p-3 border-t border-gray-700">
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1">
            Online — {onlineUsers.length}
          </span>
          <div className="mt-2 space-y-1">
            {onlineUsers.slice(0, 5).map((u, i) => (
              <div key={i} className="flex items-center gap-2 px-1">
                <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {getInitials(u.userName)}
                </div>
                <span className="text-xs text-gray-300 truncate">{u.userName}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto flex-shrink-0"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-gray-800 cursor-pointer" onClick={handleLogout}>
          <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-medium">
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
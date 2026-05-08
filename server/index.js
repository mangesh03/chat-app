const { setDefaultResultOrder } = require('dns')
setDefaultResultOrder('ipv4first')

const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const http = require('http')
const { Server } = require('socket.io')
const connectDB = require('./config/db')
const Message = require('./models/Message')

dotenv.config()
connectDB()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://chat-app-mm5s.vercel.app',  // we'll update this after Vercel deploy
        /\.vercel\.app$/  // allows any vercel subdomain
    ],
    credentials: true
}))

const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:5173',
            /\.vercel\.app$/
        ],
        methods: ['GET', 'POST']
    }
})

app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/rooms', require('./routes/rooms'))

app.get('/', (req, res) => {
    res.json({ message: 'Chat App API is running!' })
})

// online users map - stores who is online
const onlineUsers = new Map()

io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // user joins a room
    socket.on('join-room', ({ roomId, userId, userName }) => {
        socket.join(roomId)
        onlineUsers.set(socket.id, { userId, userName, roomId })

        // tell everyone in the room this user is online
        io.to(roomId).emit('user-online', {
            userId,
            userName,
            onlineUsers: [...onlineUsers.values()]
        })

        console.log(`${userName} joined room ${roomId}`)
    })

    // user sends a message
    socket.on('send-message', async ({ roomId, content, senderId, senderName }) => {
        try {
            // save message to database
            const message = await Message.create({
                content,
                sender: senderId,
                room: roomId
            })

            // broadcast message to everyone in the room
            io.to(roomId).emit('receive-message', {
                _id: message._id,
                content,
                sender: { _id: senderId, name: senderName },
                room: roomId,
                createdAt: message.createdAt
            })
        } catch (error) {
            console.error('Message error:', error)
        }
    })

    // user is typing
    socket.on('typing', ({ roomId, userName }) => {
        socket.to(roomId).emit('typing', { userName })
    })

    // user stopped typing
    socket.on('stop-typing', ({ roomId }) => {
        socket.to(roomId).emit('stop-typing')
    })

    // user disconnects
    socket.on('disconnect', () => {
        const user = onlineUsers.get(socket.id)
        if (user) {
            onlineUsers.delete(socket.id)
            io.to(user.roomId).emit('user-offline', {
                userId: user.userId,
                onlineUsers: [...onlineUsers.values()]
            })
            console.log(`${user.userName} disconnected`)
        }
    })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
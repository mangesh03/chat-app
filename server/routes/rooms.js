const express = require('express')
const Room = require('../models/Room')
const Message = require('../models/Message')
const User = require('../models/User')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// GET all rooms
router.get('/', authMiddleware, async (req, res) => {
    try {
        const rooms = await Room.find({ type: 'group' })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
        res.json(rooms)
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
})

// POST create a room
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body

        if (!name) {
            return res.status(400).json({ message: 'Room name is required' })
        }

        const existingRoom = await Room.findOne({ name, type: 'group' })
        if (existingRoom) {
            return res.status(400).json({ message: 'Room name already exists' })
        }

        const room = await Room.create({
            name,
            description,
            type: 'group',
            createdBy: req.user.id,
            members: [req.user.id]
        })

        await room.populate('createdBy', 'name')
        res.status(201).json(room)
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
})

// POST join a room
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body

        if (!name) {
            return res.status(400).json({ message: 'Room name is required' })
        }

        const existingRoom = await Room.findOne({ name, type: 'group' })
        if (existingRoom) {
            return res.status(400).json({ message: 'Room name already exists' })
        }

        const room = await Room.create({
            name,
            description,
            type: 'group',
            createdBy: req.user.id,
            members: [req.user.id]
        })

        await room.populate('createdBy', 'name')
        res.status(201).json(room)
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
})

// GET messages for a room
router.get('/:id/messages', authMiddleware, async (req, res) => {
    try {
        const messages = await Message.find({ room: req.params.id })
            .populate('sender', 'name _id')
            .sort({ createdAt: 1 })
            .limit(50)
        res.json(messages)
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
})

// GET all users except current user
router.get('/users/list', authMiddleware, async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.id } })
            .select('name email')
            .sort({ name: 1 })
        res.json(users)
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
})

// POST create or get existing DM between 2 users
router.post('/dm/:userId', authMiddleware, async (req, res) => {
    try {
        const otherUserId = req.params.userId
        const myId = req.user.id

        // Check if DM already exists between these 2 users
        const existingDM = await Room.findOne({
            type: 'direct',
            members: { $all: [myId, otherUserId], $size: 2 }
        })

        if (existingDM) {
            return res.json(existingDM)
        }

        // Get other user's name for room name
        const otherUser = await User.findById(otherUserId).select('name')
        const myUser = await User.findById(myId).select('name')

        if (!otherUser) {
            return res.status(404).json({ message: 'User not found' })
        }

        // Create new DM room
        const dm = await Room.create({
            name: `${myUser.name}-${otherUser.name}`,
            type: 'direct',
            createdBy: myId,
            members: [myId, otherUserId]
        })

        res.status(201).json(dm)
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
})


module.exports = router
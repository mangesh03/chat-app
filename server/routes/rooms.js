const express = require('express')
const Room = require('../models/Room')
const Message = require('../models/Message')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// GET all rooms
router.get('/', authMiddleware, async (req, res) => {
    try {
        const rooms = await Room.find()
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

        const existingRoom = await Room.findOne({ name })
        if (existingRoom) {
            return res.status(400).json({ message: 'Room name already exists' })
        }

        const room = await Room.create({
            name,
            description,
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
router.post('/:id/join', authMiddleware, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)

        if (!room) {
            return res.status(404).json({ message: 'Room not found' })
        }

        if (room.members.includes(req.user.id)) {
            return res.status(400).json({ message: 'Already a member' })
        }

        room.members.push(req.user.id)
        await room.save()

        res.json({ message: 'Joined room successfully', room })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
})

// GET messages for a room
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.id })
      .populate('sender', 'name _id')  // Add _id here!
      .sort({ createdAt: 1 })
      .limit(50)

    res.json(messages)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    if (process.env.MONGO_URI && process.env.MONGO_URI.includes('mongodb+srv')) {
      const { setDefaultResultOrder } = require('dns')
      setDefaultResultOrder('ipv4first')
    }

    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp', {
      family: 4,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    })
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    console.log('Falling back to in-memory database...')
    const { MongoMemoryServer } = require('mongodb-memory-server')
    const mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    await mongoose.connect(uri)
    console.log('MongoDB connected! (in-memory fallback)')
  }
}

module.exports = connectDB
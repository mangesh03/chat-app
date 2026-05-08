const mongoose = require('mongoose')

const connectDB = async () => {
  const uri = process.env.MONGO_URI

  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server')
    const mongod = await MongoMemoryServer.create()
    const memUri = mongod.getUri()
    console.log('Memory DB URI:', memUri) // Add this line
    await mongoose.connect(memUri)
    console.log('MongoDB connected! (in-memory)')
    return
  }

  try {
    const { setDefaultResultOrder } = require('dns')
    setDefaultResultOrder('ipv4first')
    await mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 30000 })
    console.log('MongoDB connected! (Atlas)')
  } catch (error) {
    const { MongoMemoryServer } = require('mongodb-memory-server')
    const mongod = await MongoMemoryServer.create()
    const memUri = mongod.getUri()
    console.log('Memory DB URI:', memUri) // Add this line
    await mongoose.connect(memUri)
    console.log('MongoDB connected! (in-memory fallback)')
  }
}

module.exports = connectDB
import express from 'express'
import logger from 'morgan'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

const app = express()
const server = createServer(app)
const io = new Server(server, {
    connectionStateRecovery: {}
})
const PORT = process.env.PORT ?? 3000

io.on('connection', (socket) => {
    console.log('a user has connected!')

    socket.on('disconnect', () => {
        console.log('an user has disconnected')
    })

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg)
    })
})

app.use(logger('dev'))

app.get('/', (req,res) => {
    res.sendFile(process.cwd() + '/client/index.html')
})

server.listen(PORT, ()=>{
    console.log(`Server running http://localhost:${PORT}`)
})
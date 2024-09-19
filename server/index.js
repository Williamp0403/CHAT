import express from 'express'
import logger from 'morgan'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import dotenv from 'dotenv' 
import { createClient } from '@libsql/client' // npm install @libsql/client dotenv => (Dependecia de turso y dotenv para leer variables de entorno)
import { devNull } from 'node:os'

dotenv.config()
const app = express()
const server = createServer(app)
const io = new Server(server, {
    connectionStateRecovery: {}
})
const PORT = process.env.PORT ?? 3000

const db = createClient ({
    url: 'libsql://fitting-insect-williamp0403.turso.io',
    authToken: process.env.DB_TOKEN
})

await db.execute (`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content text
    )
`)

io.on('connection', async (socket) => {
    console.log('a user has connected!')

    socket.on('disconnect', () => {
        console.log('an user has disconnected')
    })

    socket.on('set message', async (msg) => {
        let result
        try {
            result = await db.execute ({
                sql:'INSERT INTO messages (content) VALUES (:msg)',
                args: { msg }
            })
        } catch (e) {
            console.error(e)
            return
        }
        io.emit('chat message', msg, result.lastInsertRowid.toString())
    })

    if (!socket.recovered) {
        try {
            const results = await db.execute ({
                sql:'SELECT id, content FROM messages WHERE id > ?',
                args: [socket.handshake.auth.lastMessageId ?? 0]
            })
            results.rows.forEach(row => {
                socket.emit('chat message', row.content, row.id.toString())
            })
        } catch (e)  {

        }
    }
})

app.use(logger('dev'))

app.get('/', (req,res) => {
    res.sendFile(process.cwd() + '/client/index.html')
})

server.listen(PORT, () => {
    console.log(`Server running http://localhost:${PORT}`)
})
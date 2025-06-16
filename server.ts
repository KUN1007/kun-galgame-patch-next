import { createServer } from 'http'
import { Server } from 'socket.io'
import { parse } from 'url'
import next from 'next'
import express from 'ultimate-express'
import { onSocketConnection } from './socket/handler'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.NEXT_PUBLIC_KUN_PATCH_APP_ADDRESS_PROD_HOST
const port =
  Number(process.env.NEXT_PUBLIC_KUN_PATCH_APP_ADDRESS_PROD_PORT) || 2333

const app = next({ dev, hostname, port, turbopack: true })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const expressApp = express()

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)

    if (parsedUrl.pathname?.startsWith('/api/socket')) {
      expressApp(req, res)
    } else {
      handle(req, res, parsedUrl)
    }
  }).once('error', (err) => {
    console.error(err)
    process.exit(1)
  })

  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXT_PUBLIC_KUN_PATCH_ADDRESS_DEV
    }
  })

  io.on('connection', (socket) => {
    onSocketConnection(io, socket)
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(
      `> Socket.IO server listening on http://${hostname}:${port}/api/socket`
    )
  })
})

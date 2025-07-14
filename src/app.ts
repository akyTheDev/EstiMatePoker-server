import { v4 as uuidv4 } from 'uuid'
import { WebSocket } from 'ws'

import { configureContainer } from './container'
import { RedisManager } from './infrastructure/redis'
import { ClientMetaData } from './infrastructure/web/websocket/types'
import { WsController } from './infrastructure/web/websocket/ws.controller'

const clients = new Map<
  WebSocket,
  { userId: string; userName: string; roomId: string | undefined }
>()

async function bootstrap(): Promise<void> {
  const container = await configureContainer()

  const wsController = container.resolve<WsController>('WsController')
  const redisManager = container.resolve<RedisManager>('RedisManager')
  const subscriber = redisManager.getSubscriber()
  await subscriber.pSubscribe('room:*:state', (message, _channel) => {
    const data = JSON.parse(message)
    const roomId = data.payload.roomId
    clients.forEach((clientData, ws) => {
      if (clientData.roomId === roomId && ws.readyState === WebSocket.OPEN) {
        ws.send(message)
      }
    })
  })

  const wss = new WebSocket.Server({ port: 8080 })
  wss.on('connection', (ws: WebSocket) => {
    const clientData: ClientMetaData = {
      userId: uuidv4(),
      userName: `User-${Math.floor(Math.random() * 90000) + 10000}`,
      roomId: null,
    }
    clients.set(ws, clientData)
    ws.on('message', (message: Buffer) =>
      wsController.handleMessage(ws, clientData, message),
    )
    ws.on('close', () => {
      wsController.handleDisconnect(clientData)
      clients.delete(ws)
    })
  })
}

bootstrap()

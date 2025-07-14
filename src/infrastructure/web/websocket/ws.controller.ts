import { WebSocket } from 'ws'

import {
  ClearVoteHandler,
  ClearVoteCommand,
  CreateRoomCommand,
  CreateRoomHandler,
  JoinRoomCommand,
  JoinRoomHandler,
  VoteCommand,
  VoteHandler,
  RevealVoteCommand,
  RevealVoteHandler,
  LeaveRoomHandler,
  LeaveRoomCommand,
} from '@/applications/room/commands'
import { Message } from '@/domain/shared'

import { CommandRouter } from './CommandRouter'
import { ClientMetaData, CommandType } from './types'

type CommandHandlers = {
  createRoomHandler: CreateRoomHandler
  joinRoomHandler: JoinRoomHandler
  voteHandler: VoteHandler
  revealVoteHandler: RevealVoteHandler
  clearVoteHandler: ClearVoteHandler
  leaveRoomHandler: LeaveRoomHandler
}

export class WsController {
  private readonly router: CommandRouter

  constructor(handlers: CommandHandlers) {
    this.router = new CommandRouter()
    this.router.register(
      CommandType.CREATE_ROOM,
      CreateRoomCommand,
      handlers.createRoomHandler,
    )
    this.router.register(
      CommandType.JOIN_ROOM,
      JoinRoomCommand,
      handlers.joinRoomHandler,
    )
    this.router.register(CommandType.VOTE, VoteCommand, handlers.voteHandler)
    this.router.register(
      CommandType.REVEAL_VOTE,
      RevealVoteCommand,
      handlers.revealVoteHandler,
    )
    this.router.register(
      CommandType.CLEAR_VOTE,
      ClearVoteCommand,
      handlers.clearVoteHandler,
    )
    this.router.register(
      CommandType.LEAVE_ROOM,
      LeaveRoomCommand,
      handlers.leaveRoomHandler,
    )
  }

  public async handleMessage(
    ws: WebSocket,
    clientData: ClientMetaData,
    message: Buffer,
  ) {
    try {
      const messageStr = message.toString('utf-8')
      const data = messageStr ? JSON.parse(messageStr) : {}
      if (!data.type) {
        throw new Error('Invalid message structure.')
      }

      const enrichedPayload: Record<string, any> = {
        userId: clientData.userId,
        userName: clientData.userName,
        roomId: clientData.roomId,
        ...(data.payload || {}),
      }

      const result = await this.router.route(data.type, enrichedPayload)

      clientData.roomId = clientData.roomId || result
    } catch (error) {
      console.error('Failed to handle message:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.'
      ws.send(
        JSON.stringify(
          new Message('ERROR', {
            message: errorMessage,
          }),
        ),
      )
    }
  }

  public async handleDisconnect(clientData: ClientMetaData) {
    if (!clientData.roomId) {
      return
    }

    await this.router.route(
      CommandType.LEAVE_ROOM,
      new LeaveRoomCommand(clientData.roomId, clientData.userId),
    )

    console.log(
      `User ${clientData.userId} from room ${clientData.roomId} disconnected.`,
    )
  }
}

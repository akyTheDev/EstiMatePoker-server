import { ClassConstructor, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
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
} from '@/applications/room/commands'
import { Message, ValidationError } from '@/domain/shared'

export type ClientMetaData = {
  userId: string
  userName: string
  roomId: string | undefined
}

type CommandHandlers = {
  createRoomHandler: CreateRoomHandler
  joinRoomHandler: JoinRoomHandler
  voteHandler: VoteHandler
  revealVoteHandler: RevealVoteHandler
  clearVoteHandler: ClearVoteHandler
}

export enum CommandType {
  CREATE_ROOM = 'CREATE_ROOM',
  JOIN_ROOM = 'JOIN_ROOM',
  VOTE = 'VOTE',
  REVEAL_VOTE = 'REVEAL_VOTE',
  CLEAR_VOTE = 'CLEAR_VOTE',
}

export class WsController {
  constructor(private readonly handler: CommandHandlers) {}

  public async handleMessage(ws: WebSocket, client: any, message: Buffer) {
    const { userId, userName } = client
    try {
      const messageStr = message.toString('utf-8')
      const data = messageStr ? JSON.parse(messageStr) : {}
      if (!data.type) {
        throw new Error('Invalid message structure.')
      }

      const { type } = data

      switch (type) {
        case CommandType.CREATE_ROOM: {
          const command = {
            hostId: userId,
            hostName: userName,
          } as CreateRoomCommand

          client.roomId = await this.handler.createRoomHandler.handle(command)
          break
        }

        case CommandType.JOIN_ROOM: {
          const command = await this._validateAndCreateCommand(
            JoinRoomCommand,
            {
              ...data.payload,
              userId,
              userName,
            },
          )

          client.roomId = await this.handler.joinRoomHandler.handle(command)
          break
        }

        case CommandType.VOTE: {
          const command = await this._validateAndCreateCommand(VoteCommand, {
            ...data.payload,
            userId,
            roomId: client.roomId,
          })

          await this.handler.voteHandler.handle(command)
          break
        }

        case CommandType.REVEAL_VOTE: {
          const command = await this._validateAndCreateCommand(
            RevealVoteCommand,
            {
              userId,
              roomId: client.roomId,
            },
          )

          await this.handler.revealVoteHandler.handle(command)
          break
        }

        case CommandType.CLEAR_VOTE: {
          const command = await this._validateAndCreateCommand(
            ClearVoteCommand,
            {
              userId,
              roomId: client.roomId,
            },
          )

          await this.handler.clearVoteHandler.handle(command)
          break
        }

        default: {
          console.warn('Unknown command type:', type)
          ws.send(
            JSON.stringify(
              new Message('ERROR', {
                message: `Unknown command type ${type}`,
              }),
            ),
          )
        }
      }
    } catch (error: any) {
      console.error('Failed to handle message:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Invalid message format'
      ws.send(
        JSON.stringify(
          new Message('ERROR', {
            message: errorMessage,
          }),
        ),
      )
    }
  }

  public handleDisconnect(metadata: ClientMetaData) {
    // In a real app, you would create and execute a "LeaveRoomCommand" here
    // to clean up the user's state in Redis.
    console.log(
      `User ${metadata.userId} disconnected. Cleanup logic would go here.`,
    )
  }

  private async _validateAndCreateCommand<T extends object>(
    commandClass: ClassConstructor<T>,
    plainPayload: object,
  ): Promise<T> {
    const command = plainToInstance(commandClass, plainPayload, {
      enableImplicitConversion: true,
    })
    const errors = await validate(command)
    if (errors.length > 0) {
      throw new ValidationError(`Validation failed: ${errors.toString()}`)
    }
    return command
  }
}

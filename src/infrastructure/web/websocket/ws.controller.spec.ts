import { WebSocket } from 'ws'

import {
  ClearVoteHandler,
  CreateRoomHandler,
  JoinRoomHandler,
  LeaveRoomHandler,
  RevealVoteHandler,
  VoteHandler,
} from '@/applications/room/commands'

import { CommandRouter } from './CommandRouter'
import { ClientMetaData, CommandType } from './types'
import { WsController } from './ws.controller'

jest.mock('./CommandRouter', () => {
  return {
    CommandRouter: jest.fn().mockImplementation(() => {
      return {
        register: jest.fn(),
        route: jest.fn().mockResolvedValue('test-room'),
      }
    }),
  }
})

const mockHandlers = {
  createRoomHandler: { handle: jest.fn() },
  joinRoomHandler: { handle: jest.fn() },
  voteHandler: { handle: jest.fn() },
  revealVoteHandler: { handle: jest.fn() },
  clearVoteHandler: { handle: jest.fn() },
  leaveRoomHandler: { handle: jest.fn() },
} as unknown as {
  createRoomHandler: CreateRoomHandler
  joinRoomHandler: JoinRoomHandler
  voteHandler: VoteHandler
  revealVoteHandler: RevealVoteHandler
  clearVoteHandler: ClearVoteHandler
  leaveRoomHandler: LeaveRoomHandler
}

describe('WsController', () => {
  let controller: WsController
  let mockRouter: CommandRouter
  let mockWs: WebSocket

  beforeEach(() => {
    // Instantiate the controller. The constructor will create a mocked CommandRouter.
    controller = new WsController(mockHandlers)

    mockRouter = (controller as any).router

    mockWs = { send: jest.fn() } as unknown as WebSocket
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('handleMessage', () => {
    it('should parse a JOIN_ROOM message and route it with an enriched payload', async () => {
      const clientData: ClientMetaData = {
        userId: 'user-123',
        userName: 'Test User',
        roomId: null,
      }
      const message = Buffer.from(
        JSON.stringify({
          type: CommandType.JOIN_ROOM,
          payload: { roomId: 'test-room' },
        }),
      )

      await controller.handleMessage(mockWs, clientData, message)

      expect(mockRouter.route).toHaveBeenCalledWith(
        CommandType.JOIN_ROOM,
        expect.objectContaining({
          roomId: 'test-room',
          userId: 'user-123',
          userName: 'Test User',
        }),
      )
      expect(clientData.roomId).toBe('test-room')
    })

    it('should send an error message back to the client if data does not have type', async () => {
      const clientData: ClientMetaData = {
        userId: 'user-123',
        userName: 'Test User',
        roomId: 'room-abc',
      }
      const message = Buffer.from(
        JSON.stringify({
          payload: {},
        }),
      )

      await controller.handleMessage(mockWs, clientData, message)

      expect(mockWs.send).toHaveBeenCalledTimes(1)
      const errorMessage = JSON.parse(
        (mockWs.send as jest.Mock).mock.calls[0][0],
      )
      expect(errorMessage.type).toBe('ERROR')
      expect(errorMessage.payload.message).toContain(
        'Invalid message structure.',
      )
    })
  })

  describe('handleDisconnect', () => {
    it('should route a LEAVE_ROOM command if the user was in a room', async () => {
      const clientData: ClientMetaData = {
        userId: 'user-123',
        userName: 'Test User',
        roomId: 'room-abc',
      }

      await controller.handleDisconnect(mockWs, clientData)

      expect(mockRouter.route).toHaveBeenCalledWith(
        CommandType.LEAVE_ROOM,
        expect.any(Object), // We can use a less specific matcher here
      )
    })

    it('should do nothing if the user was not in a room', async () => {
      const clientData: ClientMetaData = {
        userId: 'user-123',
        userName: 'Test User',
        roomId: null,
      }

      await controller.handleDisconnect(mockWs, clientData)

      expect(mockRouter.route).not.toHaveBeenCalled()
    })
  })
})

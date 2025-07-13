import { Room, IRoomPubSub, IRoomRepository } from '@/domain/room'

import { retryWithOptimisticLocking } from '../utils'
import { RevealVoteCommand } from './reveal-vote.command'
import { RevealVoteHandler } from './reveal-vote.handler'

jest.mock('../utils', () => ({
  retryWithOptimisticLocking: jest.fn((operation) => operation()),
}))

const mockRoomRepo: jest.Mocked<IRoomRepository> = {
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
}

const mockRoomPubSub: jest.Mocked<IRoomPubSub> = {
  publishState: jest.fn(),
}

describe('RevealVoteHandler', () => {
  let handler: RevealVoteHandler
  let room: Room

  beforeEach(() => {
    handler = new RevealVoteHandler(mockRoomRepo, mockRoomPubSub)

    room = new Room('mock-room-id-123', 'host-123')
    mockRoomRepo.findById.mockResolvedValue(room)
  })

  it('should be defined', () => {
    expect(handler).toBeDefined()
  })

  describe('handle', () => {
    it('should make the reveal of the room as true and publish state', async () => {
      const command = new RevealVoteCommand('mock-room-id-123', 'test-user-id')

      await handler.handle(command)

      expect(retryWithOptimisticLocking).toHaveBeenCalledTimes(1)

      expect(mockRoomRepo.findById).toHaveBeenCalledWith('mock-room-id-123')

      expect(mockRoomRepo.save).toHaveBeenCalledTimes(1)
      expect(mockRoomPubSub.publishState).toHaveBeenCalledTimes(1)

      const savedRoomArgument = (mockRoomRepo.save as jest.Mock).mock
        .calls[0][0]
      const publishedRoomArgument = (mockRoomPubSub.publishState as jest.Mock)
        .mock.calls[0][0]

      expect(savedRoomArgument).toBe(publishedRoomArgument)
      expect(savedRoomArgument).toBeInstanceOf(Room)

      expect(savedRoomArgument.id).toBe('mock-room-id-123')
      expect(savedRoomArgument.revealed).toBe(true)
    })
  })
})

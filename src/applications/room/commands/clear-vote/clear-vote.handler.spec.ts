import { Room, Participant, IRoomPubSub, IRoomRepository } from '@/domain/room'

import { retryWithOptimisticLocking } from '../utils'
import { ClearVoteCommand } from './clear-vote.command'
import { ClearVoteHandler } from './clear-vote.handler'

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

describe('ClearVoteHandler', () => {
  let handler: ClearVoteHandler
  let room: Room
  let host: Participant

  beforeEach(() => {
    handler = new ClearVoteHandler(mockRoomRepo, mockRoomPubSub)
    host = new Participant('test-user-id', 'Test User')
    room = new Room('mock-room-id-123', 'test-user-id')
    room.addParticipant(host)
    room.castVote(host.id, '8')
    room.reveal()
    mockRoomRepo.findById.mockResolvedValue(room)
  })

  it('should be defined', () => {
    expect(handler).toBeDefined()
  })

  describe('handle', () => {
    it('should delete all votes and assign revealed as false and publish the state', async () => {
      const command = new ClearVoteCommand('mock-room-id-123', 'test-user-id')

      const roomId = await handler.handle(command)
      expect(roomId).toBe('mock-room-id-123')

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
      expect(savedRoomArgument.revealed).toBe(false)

      const host = savedRoomArgument.getParticipants().get('test-user-id')
      expect(host).toBeInstanceOf(Participant)
      expect(host.name).toBe('Test User')
      expect(host.vote).toBeUndefined()
    })
  })
})

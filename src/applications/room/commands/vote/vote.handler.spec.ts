import { Room, Participant, IRoomPubSub, IRoomRepository } from '@/domain/room'

import { retryWithOptimisticLocking } from '../utils'
import { VoteCommand } from './vote.command'
import { VoteHandler } from './vote.handler'

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

describe('VoteHandler', () => {
  let handler: VoteHandler
  let room: Room
  let host: Participant
  let testUser: Participant

  beforeEach(() => {
    handler = new VoteHandler(mockRoomRepo, mockRoomPubSub)

    host = new Participant('host-123', 'Host User')
    testUser = new Participant('test-user-id', 'Test User')
    room = new Room('mock-room-id-123', 'host-123')
    room.addParticipant(host)
    room.addParticipant(testUser)
    mockRoomRepo.findById.mockResolvedValue(room)
  })

  it('should be defined', () => {
    expect(handler).toBeDefined()
  })

  describe('handle', () => {
    it('should find a room, cast a vote, save, and publish the state', async () => {
      const command = new VoteCommand('mock-room-id-123', 'test-user-id', '8')

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
      expect(savedRoomArgument.hostId).toBe('host-123')
      expect(savedRoomArgument.getParticipants().size).toBe(2)

      const hostParticipant = savedRoomArgument
        .getParticipants()
        .get('host-123')
      expect(hostParticipant).toBeInstanceOf(Participant)
      expect(hostParticipant.name).toBe('Host User')
      expect(hostParticipant.vote).toBeUndefined()

      const testParticipant = savedRoomArgument
        .getParticipants()
        .get('test-user-id')
      expect(testParticipant).toBeInstanceOf(Participant)
      expect(testParticipant.name).toBe('Test User')
      expect(testParticipant.vote).toBe('8')
    })
  })
})

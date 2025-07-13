import { Room, Participant, IRoomPubSub, IRoomRepository } from '@/domain/room'

import { JoinRoomCommand } from './join-room.command'
import { JoinRoomHandler } from './join-room.handler'

const mockRoomRepo: jest.Mocked<IRoomRepository> = {
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
}

const mockRoomPubSub: jest.Mocked<IRoomPubSub> = {
  publishState: jest.fn(),
}

describe('JoinRoomHandler', () => {
  let handler: JoinRoomHandler
  let room: Room
  let host: Participant

  beforeEach(() => {
    handler = new JoinRoomHandler(mockRoomRepo, mockRoomPubSub)

    host = new Participant('host-123', 'Host User')
    room = new Room('mock-room-id-123', 'host-123')
    room.addParticipant(host)
    mockRoomRepo.findById.mockResolvedValue(room)
  })

  it('should be defined', () => {
    expect(handler).toBeDefined()
  })

  describe('handle', () => {
    it('should add the participant and publish the state', async () => {
      const command = new JoinRoomCommand(
        'mock-room-id-123',
        'newuser-123',
        'New User',
      )

      await handler.handle(command)

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

      const newParticipant = savedRoomArgument
        .getParticipants()
        .get('newuser-123')
      expect(newParticipant).toBeInstanceOf(Participant)
      expect(newParticipant.name).toBe('New User')
    })
  })
})

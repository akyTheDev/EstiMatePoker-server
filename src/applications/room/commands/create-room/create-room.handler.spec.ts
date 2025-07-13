import { CreateRoomHandler } from './create-room.handler'
import { CreateRoomCommand } from './create-room.command'
import { Room, Participant } from '../../../../domain/room/entities'
import { IRoomPubSub, IRoomRepository } from 'src/domain/room/ports'

jest.mock('uuid', () => ({
  v4: () => 'mock-room-id-123',
}))

const mockRoomRepo: IRoomRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  delete: jest.fn(),
}

const mockRoomPubSub: IRoomPubSub = {
  publishState: jest.fn(),
}

describe('CreateRoomHandler', () => {
  let handler: CreateRoomHandler

  beforeEach(() => {
    handler = new CreateRoomHandler(mockRoomRepo, mockRoomPubSub)
  })

  it('should be defined', () => {
    expect(handler).toBeDefined()
  })

  describe('handle', () => {
    it('should create a new room and publish the state', async () => {
      const command = {
        hostId: 'host-123',
        hostName: 'Host User',
      }
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
      expect(savedRoomArgument.getParticipants().size).toBe(1)

      const hostParticipant = savedRoomArgument
        .getParticipants()
        .get('host-123')
      expect(hostParticipant).toBeInstanceOf(Participant)
      expect(hostParticipant.name).toBe('Host User')
    })
  })
})

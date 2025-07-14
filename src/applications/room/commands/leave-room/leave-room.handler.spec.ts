import { Room, Participant, IRoomPubSub, IRoomRepository } from '@/domain/room'

import { LeaveRoomCommand } from './leave-room.command'
import { LeaveRoomHandler } from './leave-room.handler'

const mockRoomRepo: jest.Mocked<IRoomRepository> = {
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
}

const mockRoomPubSub: jest.Mocked<IRoomPubSub> = {
  publishState: jest.fn(),
}

describe('LeaveRoomHandler', () => {
  let handler: LeaveRoomHandler
  let room: Room
  let host: Participant

  beforeEach(() => {
    handler = new LeaveRoomHandler(mockRoomRepo, mockRoomPubSub)

    host = new Participant('host-123', 'Host User')
    room = new Room('mock-room-id-123', 'host-123')
    room.addParticipant(host)
    mockRoomRepo.findById.mockResolvedValue(room)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(handler).toBeDefined()
  })

  it('should remove participant and publish the state', async () => {
    const user1 = new Participant('user-123', 'User 1')
    room.addParticipant(user1)
    const command = new LeaveRoomCommand('mock-room-id-123', 'user-123')

    const roomId = await handler.handle(command)
    expect(roomId).toBe('mock-room-id-123')

    expect(mockRoomRepo.save).toHaveBeenCalledTimes(1)
    expect(mockRoomRepo.delete).not.toHaveBeenCalled()
    expect(mockRoomPubSub.publishState).toHaveBeenCalledTimes(1)

    const savedRoomArgument = (mockRoomRepo.save as jest.Mock).mock.calls[0][0]
    const publishedRoomArgument = (mockRoomPubSub.publishState as jest.Mock)
      .mock.calls[0][0]

    expect(savedRoomArgument).toBe(publishedRoomArgument)
    expect(savedRoomArgument).toBeInstanceOf(Room)

    expect(savedRoomArgument.id).toBe('mock-room-id-123')
    expect(savedRoomArgument.hostId).toBe('host-123')
    expect(savedRoomArgument.getParticipants().size).toBe(1)

    const hostParticipant = savedRoomArgument.getParticipants().get('host-123')
    expect(hostParticipant).toBeInstanceOf(Participant)
    expect(hostParticipant.name).toBe('Host User')
  })

  it('should remove the room if the last participant leaves', async () => {
    const command = new LeaveRoomCommand('mock-room-id-123', 'host-123')

    const roomId = await handler.handle(command)
    expect(roomId).toBe('mock-room-id-123')

    expect(mockRoomRepo.save).not.toHaveBeenCalled()
    expect(mockRoomRepo.delete).toHaveBeenCalledTimes(1)
    expect(mockRoomPubSub.publishState).not.toHaveBeenCalled()

    expect(mockRoomRepo.delete).toHaveBeenCalledWith('mock-room-id-123')
  })
})

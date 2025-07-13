import { RedisClientType } from 'redis'

import { Room, Participant } from '@/domain/room/entities'

import { RedisPubSub } from './RedisPubSub'

const mockRedisClient = {
  publish: jest.fn(),
} as unknown as jest.Mocked<RedisClientType>

describe('RedisPubSub', () => {
  let adapter: RedisPubSub

  beforeEach(() => {
    jest.clearAllMocks()
    adapter = new RedisPubSub(mockRedisClient)
  })

  it('should be defined', () => {
    expect(adapter).toBeDefined()
  })

  describe('publishState', () => {
    it('should publish a correctly formatted payload when votes are revealed', async () => {
      const room = new Room('room-unit-test', 'host-123')
      const participant = new Participant('user-abc', 'Test User')
      participant.vote = '13'
      room.addParticipant(participant)
      room.reveal()

      const expectedChannel = `room:${room.id}:state`

      await adapter.publishState(room)

      expect(mockRedisClient.publish).toHaveBeenCalledTimes(1)

      const [channel, message] = mockRedisClient.publish.mock.calls[0]

      expect(channel).toBe(expectedChannel)

      const parsedMessage = JSON.parse(message.toString())
      expect(parsedMessage.type).toBe('ROOM_STATE_UPDATE')
      expect(parsedMessage.payload.revealed).toBe(true)
      expect(parsedMessage.payload.participants['user-abc'].vote).toBe('13')
    })

    it('should publish a payload with null votes when not revealed', async () => {
      const room = new Room('room-hidden-test', 'host-456')
      const participant = new Participant('user-def', 'Another User')
      participant.vote = '8'
      room.addParticipant(participant)

      await adapter.publishState(room)

      expect(mockRedisClient.publish).toHaveBeenCalledTimes(1)

      const [, message] = mockRedisClient.publish.mock.calls[0]
      const parsedMessage = JSON.parse(message.toString())

      expect(parsedMessage.payload.revealed).toBe(false)
      expect(
        parsedMessage.payload.participants['user-def'].vote,
      ).toBeUndefined()
    })
  })
})

import { createClient, RedisClientType } from 'redis'

import { RedisRoomRepository } from './RedisRoomRepository'
import { Room, Participant } from '../../../domain/room/entities'
import { config } from '../../../infrastructure/config'

describe('RedisRoomRepository (Integration)', () => {
  let redisClient: RedisClientType
  let repo: RedisRoomRepository

  beforeAll(async () => {
    redisClient = createClient({ url: config.REDIS_URL })
    await redisClient.connect()
    repo = new RedisRoomRepository(redisClient)
  })

  afterEach(async () => {
    await redisClient.flushDb()
  })

  afterAll(async () => {
    await redisClient.quit()
  })

  it('should be defined after connection', () => {
    expect(repo).toBeDefined()
  })

  it('should save a new room and find it by ID', async () => {
    const room = new Room('room-123', 'host-abc')
    const participant = new Participant('host-abc', 'Host User')
    room.addParticipant(participant)

    await repo.save(room)

    const foundRoom = await repo.findById('room-123')

    expect(foundRoom).not.toBeNull()
    expect(foundRoom?.id).toBe('room-123')
    expect(foundRoom?.hostId).toBe('host-abc')
    expect(foundRoom?.version).toBe(1)
    expect(foundRoom?.getParticipants().size).toBe(1)
  })

  it('should return null when finding a non-existent room', async () => {
    const foundRoom = await repo.findById('non-existent-room')

    expect(foundRoom).toBeUndefined()
  })

  it('should correctly handle optimistic locking conflicts', async () => {
    const room1 = new Room('conflict-room', 'host-1')
    await repo.save(room1)

    const room2 = new Room('conflict-room', 'host-1')
    room2.version = 0

    await expect(repo.save(room2)).rejects.toThrow(
      'Conflict: Room has been modified by another process.',
    )
  })

  it('should delete a room by ID', async () => {
    const room = new Room('room-123', 'host-abc')
    const participant = new Participant('host-abc', 'Host User')
    room.addParticipant(participant)

    await repo.save(room)

    await repo.delete('room-123')

    const foundRoom = await repo.findById('room-123')

    expect(foundRoom).toBeUndefined()
  })
})

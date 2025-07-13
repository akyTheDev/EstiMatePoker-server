import { RedisClientType } from 'redis'

import { Room, Participant, IRoomRepository } from '@/domain/room/entities'
import { ConflictResourceError, NotFoundError } from '@/domain/shared'

export class RedisRoomRepository implements IRoomRepository {
  private readonly redisKeyPrefix = 'room'

  constructor(private readonly redisClient: RedisClientType) {}

  public async findById(roomId: string): Promise<Room> {
    const roomKey = `${this.redisKeyPrefix}:${roomId}`

    const data = await this.redisClient.hGetAll(roomKey)

    if (!data || !data.id) {
      throw new NotFoundError(`Room with id ${roomId} not found.`)
    }

    const room = new Room(data.id, data.hostId)

    room.version = parseInt(data.version, 10)
    room.revealed = data.revealed === 'true'

    const participantsData = JSON.parse(data.participants || '{}')

    for (const pId in participantsData) {
      const pData = participantsData[pId]
      const participant = new Participant(pId, pData.name, pData.vote)
      room.addParticipant(participant)
    }

    return room
  }

  public async save(room: Room): Promise<void> {
    const roomKey = `${this.redisKeyPrefix}:${room.id}`

    const currentVersion = room.version
    const nextVersion = room.version + 1

    await this.redisClient.watch(roomKey)

    const versionInRedisStr = (await this.redisClient.hGet(
      roomKey,
      'version',
    )) as string
    const versionInRedis = versionInRedisStr
      ? parseInt(versionInRedisStr, 10)
      : 0

    // Optimistic Lock Check: If the version in Redis doesn't match the version of the
    // object we're trying to save, it means another process has modified it.
    // We abort the operation by unwatching and throwing a specific error.
    if (versionInRedis !== 0 && versionInRedis !== currentVersion) {
      await this.redisClient.unwatch()
      throw new ConflictResourceError(
        'Conflict: Room has been modified by another process.',
      )
    }

    const participantsData: Record<string, any> = {}
    room.getParticipants().forEach((participant) => {
      participantsData[participant.id] = {
        name: participant.name,
        vote: participant.vote,
      }
    })

    const multi = this.redisClient.multi().hSet(roomKey, [
      ['id', room.id],
      ['version', nextVersion],
      ['hostId', room.hostId],
      ['revealed', String(room.revealed)],
      ['participants', JSON.stringify(participantsData)],
    ])

    const result = await multi.exec()

    if (result === null) {
      throw new ConflictResourceError(
        'Conflict: Transaction failed due to a data race.',
      )
    }

    room.version = nextVersion
  }

  public async delete(roomId: string): Promise<void> {
    const roomKey = `${this.redisKeyPrefix}:${roomId}`
    await this.redisClient.del(roomKey)
  }
}

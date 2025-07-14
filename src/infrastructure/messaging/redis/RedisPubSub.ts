import { RedisClientType } from 'redis'

import { Room, IRoomPubSub } from '@/domain/room'

export class RedisPubSub implements IRoomPubSub {
  private readonly channelPrefix = 'room'

  constructor(private readonly redisPublisher: RedisClientType) {}

  async publishState(room: Room): Promise<void> {
    const channel = `${this.channelPrefix}:${room.id}:state`

    const participantsPayload: Record<string, any> = {}
    room.getParticipants().forEach((participant) => {
      participantsPayload[participant.id] = {
        name: participant.name,
        hasVote: !!participant.vote,
        vote: room.revealed ? participant.vote : undefined,
      }
    })

    const statePayload = {
      type: 'ROOM_STATE_UPDATE',
      payload: {
        roomId: room.id,
        hostId: room.hostId,
        revealed: room.revealed,
        participants: participantsPayload,
      },
    }

    await this.redisPublisher.publish(channel, JSON.stringify(statePayload))
  }
}

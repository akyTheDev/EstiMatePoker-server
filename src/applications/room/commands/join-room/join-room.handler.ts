import { AbstractHandler } from '@/applications/common'
import { Participant, IRoomPubSub, IRoomRepository } from '@/domain/room'

import { JoinRoomCommand } from './join-room.command'

export class JoinRoomHandler extends AbstractHandler<JoinRoomCommand> {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly roomPubSub: IRoomPubSub,
  ) {
    super()
  }

  protected async perform(command: JoinRoomCommand): Promise<string> {
    const { roomId, userId, userName } = command

    const room = await this.roomRepository.findById(roomId)

    const participant = new Participant(userId, userName)
    room.addParticipant(participant)

    await this.roomRepository.save(room)
    await this.roomPubSub.publishState(room)
    return roomId
  }
}

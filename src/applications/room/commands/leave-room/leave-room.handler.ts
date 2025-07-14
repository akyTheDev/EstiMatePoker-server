import { AbstractHandler } from '@/applications/common'
import { IRoomPubSub, IRoomRepository } from '@/domain/room'

import { LeaveRoomCommand } from './leave-room.command'

export class LeaveRoomHandler extends AbstractHandler<LeaveRoomCommand> {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly roomPubSub: IRoomPubSub,
  ) {
    super()
  }

  protected async perform(command: LeaveRoomCommand): Promise<string> {
    const { roomId, userId } = command

    const room = await this.roomRepository.findById(roomId)

    room.removeParticipant(userId)

    const remainingParticipants = room.getParticipants()

    if (remainingParticipants.size === 0) {
      await this.roomRepository.delete(roomId)
    } else {
      await this.roomRepository.save(room)
      await this.roomPubSub.publishState(room)
    }

    return roomId
  }
}

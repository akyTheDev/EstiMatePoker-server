import { AbstractHandler } from '@/applications/common'
import { IRoomPubSub, IRoomRepository } from '@/domain/room'

import { VoteCommand } from './vote.command'

export class VoteHandler extends AbstractHandler<VoteCommand> {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly roomPubSub: IRoomPubSub,
  ) {
    super()
  }

  protected async perform(command: VoteCommand): Promise<string> {
    const { roomId, userId, vote } = command

    const room = await this.roomRepository.findById(roomId)

    room.castVote(userId, vote)

    await this.roomRepository.save(room)
    await this.roomPubSub.publishState(room)
    return roomId
  }
}

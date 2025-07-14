import { AbstractHandler } from '@/applications/common'
import { IRoomPubSub, IRoomRepository } from '@/domain/room'

import { ClearVoteCommand } from './clear-vote.command'

export class ClearVoteHandler extends AbstractHandler<ClearVoteCommand> {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly roomPubSub: IRoomPubSub,
  ) {
    super()
  }

  protected async perform(command: ClearVoteCommand): Promise<string> {
    const { roomId } = command

    const room = await this.roomRepository.findById(roomId)

    room.clear()

    await this.roomRepository.save(room)
    await this.roomPubSub.publishState(room)
    return roomId
  }
}

import { AbstractHandler } from '@/applications/common'
import { IRoomPubSub, IRoomRepository } from '@/domain/room'

import { RevealVoteCommand } from './reveal-vote.command'

export class RevealVoteHandler extends AbstractHandler<RevealVoteCommand> {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly roomPubSub: IRoomPubSub,
  ) {
    super()
  }

  protected async perform(command: RevealVoteCommand): Promise<string> {
    const { roomId } = command

    const room = await this.roomRepository.findById(roomId)

    room.reveal()

    await this.roomRepository.save(room)
    await this.roomPubSub.publishState(room)
    return roomId
  }
}

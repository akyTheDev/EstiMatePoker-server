import { IRoomPubSub, IRoomRepository } from '@/domain/room'

import { retryWithOptimisticLocking } from '../utils'
import { ClearVoteCommand } from './clear-vote.command'

export class ClearVoteHandler {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly roomPubSub: IRoomPubSub,
  ) {}

  async handle(command: ClearVoteCommand): Promise<void> {
    await retryWithOptimisticLocking(() => this.performClearVote(command))
  }

  private async performClearVote(command: ClearVoteCommand): Promise<void> {
    const { roomId } = command

    const room = await this.roomRepository.findById(roomId)

    room.clear()

    await this.roomRepository.save(room)
    await this.roomPubSub.publishState(room)
  }
}

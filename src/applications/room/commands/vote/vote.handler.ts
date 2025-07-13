import { IRoomPubSub, IRoomRepository } from '@/domain/room'

import { VoteCommand } from './vote.command'
import { retryWithOptimisticLocking } from '../utils'

export class VoteHandler {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly roomPubSub: IRoomPubSub,
  ) {}

  async handle(command: VoteCommand): Promise<void> {
    await retryWithOptimisticLocking(() => this.performVote(command))
  }

  private async performVote(command: VoteCommand): Promise<void> {
    const { roomId, userId, vote } = command

    const room = await this.roomRepository.findById(roomId)

    room.castVote(userId, vote)

    await this.roomRepository.save(room)
    await this.roomPubSub.publishState(room)
  }
}

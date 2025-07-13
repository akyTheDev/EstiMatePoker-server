import { IRoomPubSub, IRoomRepository } from '@/domain/room'

import { retryWithOptimisticLocking } from '../utils'
import { RevealVoteCommand } from './reveal-vote.command'

export class RevealVoteHandler {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly roomPubSub: IRoomPubSub,
  ) {}

  async handle(command: RevealVoteCommand): Promise<void> {
    await retryWithOptimisticLocking(() => this.performRevealVote(command))
  }

  private async performRevealVote(command: RevealVoteCommand): Promise<void> {
    const { roomId } = command

    const room = await this.roomRepository.findById(roomId)

    room.reveal()

    await this.roomRepository.save(room)
    await this.roomPubSub.publishState(room)
  }
}

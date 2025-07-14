import { v4 as uuidv4 } from 'uuid'

import { AbstractHandler } from '@/applications/common'
import { Room, Participant, IRoomPubSub, IRoomRepository } from '@/domain/room'

import { CreateRoomCommand } from './create-room.command'

export class CreateRoomHandler extends AbstractHandler<CreateRoomCommand> {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly roomPubSub: IRoomPubSub,
  ) {
    super()
  }

  protected async perform(command: CreateRoomCommand): Promise<string> {
    const { userId, userName } = command

    const roomId = uuidv4()
    const room = new Room(roomId, command.userId)
    const user = new Participant(userId, userName)
    room.addParticipant(user)

    await this.roomRepository.save(room)

    await this.roomPubSub.publishState(room)
    return roomId
  }
}

import { v4 as uuidv4 } from 'uuid'

import { CreateRoomCommand } from './create-room.command'
import { Room, Participant } from '../../../../domain/room/entities'
import { IRoomPubSub, IRoomRepository } from '../../../../domain/room/ports'

export class CreateRoomHandler {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly roomPubSub: IRoomPubSub,
  ) {}

  async handle(command: CreateRoomCommand): Promise<void> {
    const { hostId, hostName } = command

    const roomId = uuidv4()
    const room = new Room(roomId, command.hostId)
    const host = new Participant(hostId, hostName)
    room.addParticipant(host)

    await this.roomRepository.save(room)

    await this.roomPubSub.publishState(room)
  }
}

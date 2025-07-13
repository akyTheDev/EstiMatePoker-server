import { v4 as uuidv4 } from 'uuid'

import { Room, Participant, IRoomPubSub, IRoomRepository } from '@/domain/room'

import { CreateRoomCommand } from './create-room.command'

export class CreateRoomHandler {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly roomPubSub: IRoomPubSub,
  ) {}

  async handle(command: CreateRoomCommand): Promise<string> {
    const { hostId, hostName } = command

    const roomId = uuidv4()
    const room = new Room(roomId, command.hostId)
    const host = new Participant(hostId, hostName)
    room.addParticipant(host)

    await this.roomRepository.save(room)

    await this.roomPubSub.publishState(room)
    return roomId
  }
}

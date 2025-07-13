import { Room } from '../entities'

export interface IRoomRepository {
  findById(roomId: string): Promise<Room | undefined>
  save(room: Room): Promise<void>
  delete(roomId: string): Promise<void>
}

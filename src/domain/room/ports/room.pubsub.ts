import { Room } from '../entities'

export interface IRoomPubSub {
  publishState(room: Room): Promise<void>
}

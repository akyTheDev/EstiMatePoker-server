import { IsNotEmpty, IsUUID } from 'class-validator'

export class RevealVoteCommand {
  @IsUUID()
  @IsNotEmpty()
  public readonly roomId: string

  @IsUUID()
  @IsNotEmpty()
  public readonly userId: string

  constructor(roomId: string, userId: string) {
    this.roomId = roomId
    this.userId = userId
  }
}

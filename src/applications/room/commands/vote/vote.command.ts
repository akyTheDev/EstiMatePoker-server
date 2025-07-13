import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class VoteCommand {
  @IsUUID()
  @IsNotEmpty()
  public readonly roomId: string

  @IsUUID()
  @IsNotEmpty()
  public readonly userId: string

  @IsString()
  @IsNotEmpty()
  public readonly vote: string

  constructor(roomId: string, userId: string, vote: string) {
    this.roomId = roomId
    this.userId = userId
    this.vote = vote
  }
}

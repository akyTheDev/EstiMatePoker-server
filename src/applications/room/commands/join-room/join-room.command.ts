import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class JoinRoomCommand {
  @IsUUID()
  @IsNotEmpty()
  public readonly roomId: string

  @IsUUID()
  @IsNotEmpty()
  public readonly userId: string

  @IsString()
  @IsNotEmpty()
  public readonly userName: string

  constructor(roomId: string, userId: string, userName: string) {
    this.roomId = roomId
    this.userId = userId
    this.userName = userName
  }
}

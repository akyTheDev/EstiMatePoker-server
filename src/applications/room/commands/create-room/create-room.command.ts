import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class CreateRoomCommand {
  @IsUUID()
  @IsNotEmpty()
  public readonly userId: string

  @IsString()
  @IsNotEmpty()
  public readonly userName: string

  constructor(userId: string, userName: string) {
    this.userId = userId
    this.userName = userName
  }
}

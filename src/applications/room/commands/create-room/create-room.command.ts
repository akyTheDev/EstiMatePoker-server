import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class CreateRoomCommand {
  @IsUUID()
  @IsNotEmpty()
  public readonly hostId: string

  @IsString()
  @IsNotEmpty()
  public readonly hostName: string

  constructor(hostId: string, hostName: string) {
    this.hostId = hostId
    this.hostName = hostName
  }
}

export enum CommandType {
  CREATE_ROOM = 'CREATE_ROOM',
  JOIN_ROOM = 'JOIN_ROOM',
  VOTE = 'VOTE',
  REVEAL_VOTE = 'REVEAL_VOTE',
  CLEAR_VOTE = 'CLEAR_VOTE',
  LEAVE_ROOM = 'LEAVE_ROOM',
}

export type ClientMetaData = {
  userId: string
  userName: string
  roomId: string | undefined
}

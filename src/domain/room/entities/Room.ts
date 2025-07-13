import { Participant } from './Participant'

export class Room {
  public readonly id: string
  public hostId: string
  public revealed: boolean = false
  public version: number = 0

  private participants: Map<string, Participant>

  constructor(id: string, hostId: string) {
    this.id = id
    this.hostId = hostId
    this.participants = new Map<string, Participant>()
  }

  public addParticipant(participant: Participant): void {
    this.participants.set(participant.id, participant)
  }

  public removeParticipant(participantId: string): void {
    this.participants.delete(participantId)

    if (this.hostId === participantId && this.participants.size > 0) {
      this.hostId = this.participants.keys().next().value
    }
  }

  public getParticipants(): Map<string, Participant> {
    return this.participants
  }

  public castVote(participantId: string, vote: string): void {
    const participant = this.participants.get(participantId)

    if (!participant) {
      return
    }

    participant.vote = vote
  }

  public reveal(): void {
    this.revealed = true
  }

  public clear(): void {
    this.revealed = false
    for (const p of this.participants.values()) {
      p.vote = undefined
    }
  }
}

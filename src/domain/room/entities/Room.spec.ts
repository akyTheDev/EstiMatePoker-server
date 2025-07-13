import { Participant } from './Participant'
import { Room } from './Room'

describe('Room', () => {
  let hostParticipant: Participant
  let room: Room

  beforeEach(() => {
    hostParticipant = new Participant('host-12345', 'host-name')
    room = new Room('room-id', hostParticipant.id)
    room.addParticipant(hostParticipant)
  })

  it('should be correctly initialized', () => {
    expect(room.id).toBeDefined()
    expect(room.hostId).toBe(hostParticipant.id)
  })

  describe('addParticipants&removeParticipant&getParticipants', () => {
    let newParticipant: Participant

    beforeEach(() => {
      newParticipant = new Participant('participant-12345', 'participant-name')
      room.addParticipant(newParticipant)
    })

    it('should be able to add participants', () => {
      expect(room.hostId).toBe(hostParticipant.id)

      let participants = room.getParticipants()
      expect(participants.size).toBe(2)
      expect(participants.has(newParticipant.id)).toBe(true)
    })

    it('should be able to remove participants(normal participant)', () => {
      room.removeParticipant(newParticipant.id)
      let participants = room.getParticipants()
      expect(participants.size).toBe(1)
      expect(participants.has(hostParticipant.id)).toBe(true)
      expect(room.hostId).toBe(hostParticipant.id)
    })

    it('should be able to remove participants(host)', () => {
      room.removeParticipant(hostParticipant.id)

      let participants = room.getParticipants()
      expect(participants.size).toBe(1)
      expect(participants.has(newParticipant.id)).toBe(true)
      expect(room.hostId).toBe(newParticipant.id)
    })

    it("shouldn't be failed if host is removed and there is no participants", () => {
      room.removeParticipant(hostParticipant.id)
      room.removeParticipant(newParticipant.id)
      let participants = room.getParticipants()
      expect(participants.size).toBe(0)
    })
  })

  describe('castVote', () => {
    it('should be able to cast vote', () => {
      const participant = new Participant(
        'participant-12345',
        'participant-name',
      )
      room.addParticipant(participant)
      room.castVote(participant.id, '15')
      expect(participant.vote).toBe('15')
    })

    it("shouldn't fail if participant doesn't exist", () => {
      room.castVote('participant-12345', '15')
    })
  })

  describe('reveal', () => {
    it('should be able to reveal', () => {
      expect(room.revealed).toBe(false)
      room.reveal()
      expect(room.revealed).toBe(true)
    })
  })

  describe('clear', () => {
    it('should delete all votes and convert revealed to false', () => {
      const participant = new Participant(
        'participant-12345',
        'participant-name',
      )
      room.addParticipant(participant)
      room.castVote(participant.id, '15')
      room.reveal()
      room.clear()
      expect(room.revealed).toBe(false)
      expect(participant.vote).toBeUndefined()
    })
  })
})

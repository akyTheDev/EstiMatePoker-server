import { Participant } from './Participant'

describe('Participant', () => {
  let participant: Participant

  beforeEach(() => {
    participant = new Participant('p-id', 'p-name')
  })

  it('should be correctly initialized', () => {
    expect(participant.id).toBe('p-id')
    expect(participant.name).toBe('p-name')
    expect(participant.vote).toBe(undefined)

    participant.vote = '15'
    expect(participant.vote).toBe('15')
  })
})

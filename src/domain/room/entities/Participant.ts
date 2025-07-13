export class Participant {
  public id: string
  public name: string
  public vote: string | undefined

  constructor(id: string, name: string, vote: string | undefined = undefined) {
    this.id = id
    this.name = name
    this.vote = vote
  }
}

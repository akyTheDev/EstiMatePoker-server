export class Message {
  constructor(
    public type: string,
    public payload: Record<string, any>,
  ) {}
}

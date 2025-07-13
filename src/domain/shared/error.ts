export class BaseError extends Error {
  public readonly name: string
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string) {
    super(message)

    Object.setPrototypeOf(this, new.target.prototype)
    this.name = this.constructor.name
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message)
  }
}

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message)
  }
}

export class ConflictResourceError extends BaseError {
  constructor(message: string) {
    super(message)
  }
}

import { ClassConstructor, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { AbstractHandler } from '@/applications/common'
import { ValidationError } from '@/domain/shared'

import { CommandType } from './types'

export class CommandRouter {
  private readonly routes = new Map<
    string,
    {
      commandClass: ClassConstructor<any>
      handler: AbstractHandler<any>
    }
  >()

  public register<T extends object>(
    type: CommandType,
    commandClass: ClassConstructor<T>,
    handler: AbstractHandler<T>,
  ) {
    this.routes.set(type, { commandClass, handler })
  }

  public async route(type: string, payload: any): Promise<any> {
    const route = this.routes.get(type)
    if (!route) {
      throw new Error(`Unknown command type: ${type}`)
    }

    const { commandClass, handler } = route

    const command = await this._validateAndCreateCommand(commandClass, payload)

    return await handler.handle(command)
  }

  private async _validateAndCreateCommand<T extends object>(
    commandClass: ClassConstructor<T>,
    plainPayload: object,
  ): Promise<T> {
    const command = plainToInstance(commandClass, plainPayload)
    const errors = await validate(command)
    if (errors.length > 0) {
      throw new ValidationError(`Validation failed: ${errors.toString()}`)
    }
    return command
  }
}

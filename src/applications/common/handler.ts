import { retryWithOptimisticLocking } from '../room/commands/utils'

export abstract class AbstractHandler<TCommand> {
  async handle(command: TCommand): Promise<string> {
    return await retryWithOptimisticLocking<string>(() => this.perform(command))
  }

  protected abstract perform(command: TCommand): Promise<string>
}

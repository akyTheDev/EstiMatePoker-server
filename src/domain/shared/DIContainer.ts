export class DIContainer {
  private services = new Map<string, any>()

  /**
   * Registers a dependency with the container.
   *
   * @param token A unique string identifier for the dependency.
   * @param instance The actual instance of the service.
   */
  public register<T>(token: string, instance: T): void {
    this.services.set(token, instance)
  }

  /**
   * Resolves a dependency from the container.
   *
   * @param token The unique string identifier for the dependency.
   * @returns The registered instance of the service.
   * @throws An error if the token is not found.
   */
  public resolve<T>(token: string): T {
    const service = this.services.get(token)
    if (!service) {
      throw new Error(`DI token not found: "${token}"`)
    }
    return service as T
  }
}

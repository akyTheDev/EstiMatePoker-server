import { createClient, RedisClientType } from 'redis'

import { config } from '../config'

export class RedisManager {
  private client: RedisClientType
  private subscriber: RedisClientType
  private isConnected: boolean = false

  constructor() {
    this.client = createClient({ url: config.REDIS_URL })
    this.subscriber = this.client.duplicate()

    // Set up centralized error handling
    this.client.on('error', (err) => console.error('Redis Client Error', err))
    this.subscriber.on('error', (err) =>
      console.error('Redis Subscriber Error', err),
    )
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return
    }

    try {
      await Promise.all([this.client.connect(), this.subscriber.connect()])
      await Promise.all([this.client.ping(), this.subscriber.ping()])

      this.isConnected = true
      console.log('Successfully connected to Redis and ready.')
    } catch (error) {
      console.error(
        'Fatal: Failed to connect to Redis. Application cannot start.',
        error,
      )
      throw new Error('Failed to connect to Redis.')
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await Promise.all([this.client.quit(), this.subscriber.quit()])
      this.isConnected = false
      console.log('Successfully disconnected from Redis.')
    }
  }

  public getClient(): RedisClientType {
    if (!this.isConnected) {
      throw new Error('Redis is not connected')
    }
    return this.client
  }

  public getSubscriber(): RedisClientType {
    if (!this.isConnected) {
      throw new Error('Redis is not connected')
    }
    return this.subscriber
  }
}

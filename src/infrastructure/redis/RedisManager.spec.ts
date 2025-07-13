import { RedisManager } from './RedisManager'
import { createClient } from 'redis'

jest.mock('redis', () => ({
  createClient: jest.fn(),
}))

describe('RedisService', () => {
  const mockConnect = jest.fn().mockResolvedValue(undefined)
  const mockPing = jest.fn().mockResolvedValue('PONG')
  const mockQuit = jest.fn().mockResolvedValue(undefined)
  const mockDuplicate = jest.fn()
  const mockOn = jest.fn()

  const mockedCreateClient = createClient as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    mockedCreateClient.mockReturnValue({
      connect: mockConnect,
      ping: mockPing,
      quit: mockQuit,
      on: mockOn,
      duplicate: mockDuplicate.mockReturnValue({
        ping: mockPing,
        connect: mockConnect,
        quit: mockQuit,
        on: mockOn,
      }),
    })
  })

  it('should connect successfully and set internal state', async () => {
    const redisManager = new RedisManager()
    await redisManager.connect()

    expect(createClient).toHaveBeenCalledTimes(1)
    expect(mockDuplicate).toHaveBeenCalledTimes(1)
    expect(mockConnect).toHaveBeenCalledTimes(2)
    expect(mockPing).toHaveBeenCalledTimes(2)
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function))

    expect(redisManager.getClient()).toBeDefined()
    expect(redisManager.getSubscriber()).toBeDefined()
  })

  it('should throw an error if getClient is called before connecting', () => {
    const redisManager = new RedisManager()

    expect(() => redisManager.getClient()).toThrow('Redis is not connected')
  })

  it('should throw an error if getSubscriber is called before connecting', () => {
    const redisManager = new RedisManager()

    expect(() => redisManager.getSubscriber()).toThrow('Redis is not connected')
  })

  it('should not try to connect if already connected', async () => {
    const redisManager = new RedisManager()
    await redisManager.connect()
    await redisManager.connect()

    expect(createClient).toHaveBeenCalledTimes(1)
    expect(mockConnect).toHaveBeenCalledTimes(2)
  })

  it('should gracefully disconnect', async () => {
    const redisManager = new RedisManager()
    await redisManager.connect()

    await redisManager.disconnect()

    expect(mockQuit).toHaveBeenCalledTimes(2)

    expect(() => redisManager.getClient()).toThrow()
  })

  it('should throw on error when fatal connection error', async () => {
    mockConnect.mockRejectedValueOnce(new Error('Connection timed out'))

    const redisManager = new RedisManager()

    expect(redisManager.connect()).rejects.toThrow(
      'Failed to connect to Redis.',
    )
  })
})

import { ConfigService } from './config-service'

describe('ConfigService', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should create a valid configuration', () => {
    process.env.REDIS_URL = 'redis://localhost:6479'

    const configService = new ConfigService()
    const config = configService.config

    expect(config).toEqual({
      REDIS_URL: 'redis://localhost:6479',
    })
  })

  it('should throw an error if environment variables are not correct', () => {
    delete process.env.REDIS_URL

    expect(() => new ConfigService()).toThrow(
      'Environment variable validation error',
    )
  })
})

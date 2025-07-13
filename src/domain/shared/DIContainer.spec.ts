import { DIContainer } from './DIContainer'

describe('DIContainer', () => {
  let container: DIContainer

  beforeEach(() => {
    container = new DIContainer()
  })

  it('should be defined', () => {
    expect(container).toBeDefined()
  })

  it('should be able to register and resolve dependencies', () => {
    container.register('foo', 'bar')
    expect(container.resolve('foo')).toBe('bar')
  })

  it('should throw an error if the token is not found', () => {
    expect(() => container.resolve('foo')).toThrow('DI token not found: "foo"')
  })
})

import { createLogger } from './logger.utils'

describe('createLogger', () => {
  afterEach(() => jest.restoreAllMocks())

  it('delegates each log level to the matching console method with its scope', () => {
    const logger = createLogger('test-scope')

    for (const method of ['info', 'warn', 'error', 'debug'] as const) {
      const consoleMethod = jest.spyOn(console, method).mockImplementation(() => undefined)

      logger[method]('message')

      expect(consoleMethod).toHaveBeenCalledWith('[test-scope]', 'message')
    }
  })
})

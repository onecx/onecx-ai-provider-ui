import { parseModelConfig, serializeModelConfig } from './model-config.utils'

describe('model-config.utils', () => {
  describe('parseModelConfig', () => {
    it('defaults a missing configuration to Chat Completions', () => {
      expect(parseModelConfig(undefined)).toEqual({
        api: 'chat-completions',
        reasoningEffort: '',
        hasLegacyWarning: false
      })
    })

    it('defaults blank configuration to Chat Completions without warning', () => {
      expect(parseModelConfig('  \n')).toEqual({
        api: 'chat-completions',
        reasoningEffort: '',
        hasLegacyWarning: false
      })
    })

    it('defaults an empty supported configuration without warning', () => {
      expect(parseModelConfig('{}')).toEqual({
        api: 'chat-completions',
        reasoningEffort: '',
        hasLegacyWarning: false
      })
    })

    it('reads supported fields and trims the reasoning effort', () => {
      expect(parseModelConfig('{"api":"responses","reasoningEffort":"  medium  "}')).toEqual({
        api: 'responses',
        reasoningEffort: 'medium',
        hasLegacyWarning: false
      })
    })

    it('defaults a missing API and preserves a supported effort', () => {
      expect(parseModelConfig('{"reasoningEffort":"high"}')).toEqual({
        api: 'chat-completions',
        reasoningEffort: 'high',
        hasLegacyWarning: false
      })
    })

    it.each([
      ['malformed JSON', '{'],
      ['unknown keys', '{"temperature":0.2}'],
      ['unsupported API value', '{"api":"other"}'],
      ['wrong API type', '{"api":2}'],
      ['wrong reasoning effort type', '{"reasoningEffort":2}'],
      ['non-object JSON', '[1, 2]']
    ])('flags %s as legacy and supplies defaults', (_description, modelConfig) => {
      expect(parseModelConfig(modelConfig)).toEqual({
        api: 'chat-completions',
        reasoningEffort: '',
        hasLegacyWarning: true
      })
    })

    it('uses standard JSON parsing and serializes repeated keys into a single supported setting', () => {
      const config = parseModelConfig('{"api":"chat-completions","api":"responses"}')

      expect(config).toEqual({
        api: 'responses',
        reasoningEffort: '',
        hasLegacyWarning: false
      })
      expect(serializeModelConfig(config.api, config.reasoningEffort)).toBe('{"api":"responses"}')
    })

    it('reads escaped keys and quoted string values', () => {
      expect(parseModelConfig('{"\\u0061pi":"responses","reasoning\\u0045ffort":"api: \\"api\\""}')).toEqual({
        api: 'responses',
        reasoningEffort: 'api: "api"',
        hasLegacyWarning: false
      })
    })

    it('does not interpret non-OpenAI configuration', () => {
      expect(parseModelConfig('{"api":"chat-completions","api":"responses"}', false)).toEqual({
        api: 'chat-completions',
        reasoningEffort: '',
        hasLegacyWarning: false
      })
    })
  })

  describe('serializeModelConfig', () => {
    it('omits the default API and blank effort', () => {
      expect(serializeModelConfig('chat-completions', '  ')).toBe('{}')
    })

    it('writes Responses and a trimmed reasoning effort', () => {
      expect(serializeModelConfig('responses', '  medium  ')).toBe('{"api":"responses","reasoningEffort":"medium"}')
    })

    it('omits the default API when serializing a nonblank effort', () => {
      expect(serializeModelConfig('chat-completions', ' high ')).toBe('{"reasoningEffort":"high"}')
    })

    it('escapes quotes and backslashes in reasoning effort', () => {
      expect(serializeModelConfig('chat-completions', ' say "hi" \\ now ')).toBe(
        '{"reasoningEffort":"say \\"hi\\" \\\\ now"}'
      )
    })
  })
})

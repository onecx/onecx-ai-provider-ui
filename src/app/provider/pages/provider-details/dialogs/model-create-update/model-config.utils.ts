export type ModelApi = 'chat-completions' | 'responses'

export interface ParsedModelConfig {
  api: ModelApi
  reasoningEffort: string
  hasLegacyWarning: boolean
}

interface ModelConfiguration {
  api?: ModelApi
  reasoningEffort?: string
}

export function parseModelConfig(modelConfig?: string, isOpenAi = true): ParsedModelConfig {
  const defaults: ParsedModelConfig = {
    api: 'chat-completions',
    reasoningEffort: '',
    hasLegacyWarning: false
  }
  if (!isOpenAi || !modelConfig?.trim()) {
    return defaults
  }

  try {
    const parsed: unknown = JSON.parse(modelConfig)
    if (hasDuplicateConfigKeys(modelConfig) || !isModelConfiguration(parsed)) {
      return { ...defaults, hasLegacyWarning: true }
    }
    return {
      api: parsed.api ?? 'chat-completions',
      reasoningEffort: parsed.reasoningEffort?.trim() ?? '',
      hasLegacyWarning: false
    }
  } catch {
    return { ...defaults, hasLegacyWarning: true }
  }
}

export function serializeModelConfig(api: ModelApi, reasoningEffort: string): string {
  const effort = reasoningEffort.trim()
  const config: ModelConfiguration = {
    ...(api === 'responses' ? { api } : {}),
    ...(effort ? { reasoningEffort: effort } : {})
  }
  return JSON.stringify(config)
}

function isModelConfiguration(value: unknown): value is ModelConfiguration {
  if (!isRecord(value)) {
    return false
  }
  return (
    Object.keys(value).every((key) => key === 'api' || key === 'reasoningEffort') &&
    (value['api'] === undefined || value['api'] === 'chat-completions' || value['api'] === 'responses') &&
    (value['reasoningEffort'] === undefined || typeof value['reasoningEffort'] === 'string')
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasDuplicateConfigKeys(json: string): boolean {
  const containers: ({ type: 'object'; keys: Set<string>; expectsKey: boolean } | { type: 'array' })[] = []
  for (let index = 0; index < json.length; index++) {
    const character = json[index]
    if (character === '"') {
      const start = index
      index++
      while (index < json.length && json[index] !== '"') {
        index += json[index] === '\\' ? 2 : 1
      }
      const container = containers[containers.length - 1]
      if (container?.type === 'object' && container.expectsKey) {
        const key = JSON.parse(json.slice(start, index + 1)) as string
        if (container.keys.has(key)) {
          return true
        }
        container.keys.add(key)
        container.expectsKey = false
      }
    } else if (character === '{') {
      containers.push({ type: 'object', keys: new Set<string>(), expectsKey: true })
    } else if (character === '[') {
      containers.push({ type: 'array' })
    } else if (character === '}' || character === ']') {
      containers.pop()
    } else if (character === ',') {
      const container = containers[containers.length - 1]
      if (container?.type === 'object') {
        container.expectsKey = true
      }
    }
  }
  return false
}

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
    if (!isModelConfiguration(parsed)) {
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

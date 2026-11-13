import { AgentConfiguration } from 'src/app/shared/generated'

export interface ConfigurationVersionDiffRow {
  path: string
  /** Translation key of the field name, or undefined when the field has no known label. */
  fieldKey?: string
  /** Readable fallback for the field name, used when `fieldKey` is undefined. */
  fieldName: string
  /** Names of the array items the field belongs to, outermost first (e.g. skill or MCP server name). */
  items: string[]
  left?: string
  right?: string
  changed: boolean
}

const IGNORED_KEYS = new Set(['id'])
const DETAILS_PREFIX = 'AGENT_DETAILS.CONFIGURATION_VERSIONS.DETAILS.'
const NAME_KEY = 'AGENT_DETAILS.CONFIGURATION_VERSIONS.NAME'

const SCOPED_NAME_KEYS = new Map<string, string>([
  ['agent', `${DETAILS_PREFIX}AGENT_NAME`],
  ['provider', `${DETAILS_PREFIX}PROVIDER`],
  ['model', `${DETAILS_PREFIX}MODEL`],
  ['scaffold', `${DETAILS_PREFIX}SCAFFOLD`]
])

const LEAF_KEYS = new Map<string, string>(
  [
    ['schemaVersion', 'SCHEMA_VERSION'],
    ['tenantId', 'TENANT_ID'],
    ['description', 'DESCRIPTION'],
    ['type', 'PROVIDER_TYPE'],
    ['llmUrl', 'LLM_URL'],
    ['authMode', 'AUTH_MODE'],
    ['credentialRef', 'CREDENTIAL_REF'],
    ['modelIdentifier', 'MODEL_IDENTIFIER'],
    ['modelConfig', 'MODEL_CONFIG'],
    ['communicationMode', 'COMMUNICATION_MODE'],
    ['voiceEnabled', 'VOICE_ENABLED'],
    ['languageCode', 'LANGUAGE'],
    ['systemPrompt', 'SYSTEM_PROMPT'],
    ['source', 'SOURCE'],
    ['position', 'POSITION'],
    ['instruction', 'INSTRUCTION'],
    ['url', 'URL'],
    ['unlistedToolPermission', 'UNLISTED_TOOL_PERMISSION'],
    ['unlistedToolPermissionSource', 'UNLISTED_TOOL_PERMISSION_SOURCE'],
    ['toolName', 'TOOL_NAME'],
    ['permission', 'PERMISSION'],
    ['policySource', 'POLICY_SOURCE']
  ].map(([leaf, key]) => [leaf, `${DETAILS_PREFIX}${key}`])
)

function resolveFieldKey(root: string, leaf: string): string | undefined {
  if (leaf === 'name') {
    return SCOPED_NAME_KEYS.get(root) ?? NAME_KEY
  }
  return LEAF_KEYS.get(leaf)
}

function humanize(segment: string): string {
  return segment.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (char) => char.toUpperCase())
}

/**
 * Resolves a flattened path (e.g. `skills[Search].instruction`) into a translatable field name and its item names.
 */
export function describeField(path: string): Pick<ConfigurationVersionDiffRow, 'fieldKey' | 'fieldName' | 'items'> {
  const { base, items } = parseFieldPath(path)
  const segments = base.split('.')
  // `split` always returns at least one segment, so the last element is defined.
  const leaf = segments.at(-1) as string
  return {
    fieldKey: resolveFieldKey(segments[0], leaf),
    fieldName: humanize(leaf),
    items
  }
}

/** Splits `base[item]` paths into the base path and bracketed item names, without a backtracking regex. */
function parseFieldPath(path: string): { base: string; items: string[] } {
  const items: string[] = []
  let base = ''
  let item: string | undefined
  for (const char of path) {
    if (char === '[') {
      item = ''
    } else if (char === ']' && item !== undefined) {
      items.push(item)
      item = undefined
    } else if (item === undefined) {
      base += char
    } else {
      item += char
    }
  }
  return { base, items }
}

function itemLabel(item: unknown): string | undefined {
  if (!item || typeof item !== 'object') {
    return undefined
  }
  const { name, toolName } = item as { name?: unknown; toolName?: unknown }
  if (typeof name === 'string') {
    return name
  }
  return typeof toolName === 'string' ? toolName : undefined
}

function collectValues(value: unknown, path: string, out: Map<string, string>): void {
  if (value === null || value === undefined) {
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const label = itemLabel(item) ?? String(index)
      collectValues(item, `${path}[${label}]`, out)
    })
    return
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (IGNORED_KEYS.has(key)) {
        continue
      }
      collectValues(child, path ? `${path}.${key}` : key, out)
    }
    return
  }
  out.set(path, typeof value === 'string' ? value : JSON.stringify(value))
}

export function flattenConfiguration(configuration?: AgentConfiguration): Map<string, string> {
  const values = new Map<string, string>()
  if (configuration) {
    collectValues(configuration, '', values)
  }
  return values
}

/**
 * Compares two configuration versions field by field. Array items are addressed by `name` (falling back to index),
 * and `id` fields are skipped because they carry no user-visible configuration.
 */
export function diffConfigurationVersions(
  left?: AgentConfiguration,
  right?: AgentConfiguration
): ConfigurationVersionDiffRow[] {
  const leftValues = flattenConfiguration(left)
  const rightValues = flattenConfiguration(right)
  const paths = [...new Set([...leftValues.keys(), ...rightValues.keys()])]
  return paths.map((path) => {
    const leftValue = leftValues.get(path)
    const rightValue = rightValues.get(path)
    return {
      path,
      ...describeField(path),
      left: leftValue,
      right: rightValue,
      changed: leftValue !== rightValue
    }
  })
}

/**
 * Suggests the next `vN.0` name, based on the highest major N across `vN` and `vN.M` names.
 */
export function suggestNextVersionName(existingNames: string[]): string {
  const numbers = existingNames
    .map((name) => /^v(\d+)(\.\d+)?$/.exec(name.trim()))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => Number(match[1]))
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : existingNames.length + 1
  return `v${next}.0`
}

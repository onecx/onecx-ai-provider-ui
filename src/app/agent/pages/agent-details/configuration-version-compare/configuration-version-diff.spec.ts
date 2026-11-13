import { AgentConfiguration } from 'src/app/shared/generated'
import { describeField, diffConfigurationVersions, suggestNextVersionName } from './configuration-version-diff'

describe('diffConfigurationVersions', () => {
  const base: AgentConfiguration = {
    schemaVersion: '1.0',
    agent: { id: 'a1', name: 'Agent', description: 'desc' },
    model: { name: 'gpt-4' },
    skills: [{ name: 'search', id: 's1' } as never]
  } as AgentConfiguration

  it('returns no changed rows for identical configurations', () => {
    const rows = diffConfigurationVersions(base, JSON.parse(JSON.stringify(base)))
    expect(rows.filter((row) => row.changed)).toEqual([])
  })

  it('reports a changed scalar with left and right values', () => {
    const right = { ...base, model: { name: 'gpt-5' } } as AgentConfiguration
    const row = diffConfigurationVersions(base, right).find((r) => r.path === 'model.name')
    expect(row).toMatchObject({ path: 'model.name', left: 'gpt-4', right: 'gpt-5', changed: true })
  })

  it('ignores id fields', () => {
    const right = { ...base, agent: { ...base.agent, id: 'other' } } as AgentConfiguration
    const paths = diffConfigurationVersions(base, right).map((r) => r.path)
    expect(paths).not.toContain('agent.id')
  })

  it('marks fields present only on one side as changed', () => {
    const right = { ...base, model: undefined } as AgentConfiguration
    const row = diffConfigurationVersions(base, right).find((r) => r.path === 'model.name')
    expect(row).toMatchObject({ path: 'model.name', left: 'gpt-4', right: undefined, changed: true })
  })

  it('resolves each row to a translation key and the item names it belongs to', () => {
    const left = {
      agent: { name: 'Agent' },
      mcpServers: [{ name: 'srv', toolRules: [{ toolName: 'read', permission: 'ALLOW' }] }]
    } as unknown as AgentConfiguration
    const right = {
      agent: { name: 'Agent 2' },
      mcpServers: [{ name: 'srv', toolRules: [{ toolName: 'read', permission: 'DENY' }] }]
    } as unknown as AgentConfiguration
    const rows = diffConfigurationVersions(left, right)
    expect(rows.find((r) => r.path === 'agent.name')).toMatchObject({
      fieldKey: 'AGENT_DETAILS.CONFIGURATION_VERSIONS.DETAILS.AGENT_NAME',
      items: []
    })
    expect(rows.find((r) => r.path === 'mcpServers[srv].toolRules[read].permission')).toMatchObject({
      fieldKey: 'AGENT_DETAILS.CONFIGURATION_VERSIONS.DETAILS.PERMISSION',
      items: ['srv', 'read'],
      changed: true
    })
  })

  it('matches array items by name', () => {
    const right = {
      ...base,
      skills: [
        { name: 'other', id: 's2' },
        { name: 'search', id: 's1' }
      ]
    } as unknown as AgentConfiguration
    const rows = diffConfigurationVersions(base, right)
    expect(rows.find((r) => r.path === 'skills[search].name')?.changed).toBe(false)
    expect(rows.find((r) => r.path === 'skills[other].name')?.changed).toBe(true)
  })

  it('handles missing configurations', () => {
    expect(diffConfigurationVersions(undefined, undefined)).toEqual([])
    expect(diffConfigurationVersions(base, undefined).every((r) => r.right === undefined)).toBe(true)
  })

  it('addresses array items without a string name by index, including null and primitive items', () => {
    const left = { schemaVersion: '1.0', tags: ['a', null, { size: 1 }] } as unknown as AgentConfiguration
    const right = { schemaVersion: '1.0', tags: ['a', null, { size: 2 }] } as unknown as AgentConfiguration
    const paths = diffConfigurationVersions(left, right).map((r) => r.path)
    expect(paths).toContain('tags[2].size')
    expect(paths).toContain('tags[0]')
  })
})

describe('describeField', () => {
  it('maps scoped name fields to their parent-specific label', () => {
    expect(describeField('provider.name').fieldKey).toBe('AGENT_DETAILS.CONFIGURATION_VERSIONS.DETAILS.PROVIDER')
    expect(describeField('model.name').fieldKey).toBe('AGENT_DETAILS.CONFIGURATION_VERSIONS.DETAILS.MODEL')
    expect(describeField('scaffold.name').fieldKey).toBe('AGENT_DETAILS.CONFIGURATION_VERSIONS.DETAILS.SCAFFOLD')
  })

  it('falls back to the generic name label for item names', () => {
    expect(describeField('skills[search].name').fieldKey).toBe('AGENT_DETAILS.CONFIGURATION_VERSIONS.NAME')
  })

  it('returns no key and a humanized name for unknown fields', () => {
    expect(describeField('provider.apiKey')).toEqual({ fieldKey: undefined, fieldName: 'Api Key', items: [] })
  })
})

describe('suggestNextVersionName', () => {
  it('starts at v1.0 when there are no versions', () => {
    expect(suggestNextVersionName([])).toBe('v1.0')
  })

  it('increments the highest vN.0 name', () => {
    expect(suggestNextVersionName(['v1.0', 'v3.0', 'v2.0'])).toBe('v4.0')
  })

  it('counts minor versions such as v6.1 towards the highest major', () => {
    expect(suggestNextVersionName(['v5.0', 'v6.1'])).toBe('v7.0')
  })

  it('ignores names that do not follow the scheme', () => {
    expect(suggestNextVersionName(['initial', 'v2.0'])).toBe('v3.0')
  })

  it('falls back to the count when no name follows the scheme', () => {
    expect(suggestNextVersionName(['initial', 'test'])).toBe('v3.0')
  })
})

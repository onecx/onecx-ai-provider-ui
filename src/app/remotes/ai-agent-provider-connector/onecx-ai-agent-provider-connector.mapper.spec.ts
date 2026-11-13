import { AgentAbstract, AgentFilterKeyEnum } from 'src/app/shared/generated'

import { toAiAgentResponse, toAiAgentResponses } from './onecx-ai-agent-provider-connector.mapper'

describe('onecx-ai-agent-provider-connector.mapper', () => {
  const agent: AgentAbstract = {
    id: 'agent-1',
    name: 'Agent A',
    description: 'does things',
    languageCode: 'en',
    voiceEnabled: true,
    filter: { key: AgentFilterKeyEnum.AppId, value: 'app-1' }
  }

  describe('toAiAgentResponse', () => {
    it('maps the agent fields and the APP_ID filter to the response', () => {
      expect(toAiAgentResponse(agent)).toEqual({
        id: 'agent-1',
        name: 'Agent A',
        description: 'does things',
        languageCode: 'en',
        voiceEnabled: true,
        appId: 'app-1'
      })
    })

    it('returns null for an agent without id', () => {
      expect(toAiAgentResponse({ name: 'no id' })).toBeNull()
    })

    it('defaults the name to an empty string and leaves appId undefined without an APP_ID filter', () => {
      const response = toAiAgentResponse({ id: 'agent-2' })
      expect(response?.name).toBe('')
      expect(response?.appId).toBeUndefined()
    })
  })

  describe('toAiAgentResponses', () => {
    const other: AgentAbstract = {
      id: 'agent-2',
      name: 'Agent B',
      filter: { key: AgentFilterKeyEnum.AppId, value: 'app-2' }
    }
    const unassigned: AgentAbstract = { id: 'agent-3', name: 'Agent C' }

    it('returns all agents when no appId is requested', () => {
      expect(toAiAgentResponses([agent, other, unassigned]).map((a) => a.id)).toEqual(['agent-1', 'agent-2', 'agent-3'])
    })

    it('keeps only the agents assigned to the requested appId', () => {
      expect(toAiAgentResponses([agent, other, unassigned], 'app-1').map((a) => a.id)).toEqual(['agent-1'])
    })

    it('returns an empty list for empty input', () => {
      expect(toAiAgentResponses([])).toEqual([])
    })
  })
})

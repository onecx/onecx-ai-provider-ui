import { AgentAbstract, AgentFilterKeyEnum } from 'src/app/shared/generated'

import type { AiAgentResponse } from '@onecx/integration-interface'

export function toAiAgentResponse(agent: AgentAbstract): AiAgentResponse | null {
  if (!agent.id) {
    return null
  }
  return {
    id: agent.id,
    name: agent.name ?? '',
    description: agent.description,
    languageCode: agent.languageCode,
    voiceEnabled: agent.voiceEnabled,
    appId: agent.filter?.key === AgentFilterKeyEnum.AppId ? agent.filter.value : undefined
  }
}

/**
 * Maps the fetched agents and, when an appId is requested, keeps only the agents assigned to that application
 * (agents without an APP_ID filter are not assigned to any application).
 */
export function toAiAgentResponses(agents: AgentAbstract[], appId?: string): AiAgentResponse[] {
  return agents
    .map(toAiAgentResponse)
    .filter((agent): agent is AiAgentResponse => agent != null)
    .filter((agent) => appId == null || agent.appId === appId)
}

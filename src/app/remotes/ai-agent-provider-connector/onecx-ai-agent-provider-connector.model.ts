/**
 * Mirrors the `AiAgentRequest` / `AiAgentResponse` contract of `AiAgentGatherer` in `@onecx/integration-interface`.
 * Replace these with the library types once the released version provides them.
 */
export interface AiAgentRequest {
  appId?: string
}

export interface AiAgentResponse {
  id: string
  name: string
  description?: string
  languageCode?: string
  voiceEnabled?: boolean
  appId?: string
}

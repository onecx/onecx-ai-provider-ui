import type { AiCompletionRequest, AiContextResponse } from '@onecx/integration-interface'

import {
  ChatMessageTypeEnum,
  ChatRequest,
  ConversationConversationTypeEnum,
  RequestContext
} from 'src/app/shared/generated'

/**
 * Serialize the responses gathered from the AiContextGatherer into the flat string array the BFF
 * expects.
 *
 * Merge strategy:
 * - The AiContextGatherer returns `AiContextResponse[]`, where each element is either an object
 *   (`{ productName, appId, appPath, context }`) or `null` (an MFE that declined to contribute).
 *   The BFF's `RequestContext.aiContext` is a `string[]`. The two shapes are not compatible, so the
 *   gathered objects cannot be forwarded as-is.
 * - We drop the `null`s (no contribution) and `JSON.stringify` each remaining response, preserving
 *   the app identity (productName/appId/appPath) plus its free-form context in a single opaque
 *   string that the BFF/svc can interpret.
 * - The caller's original `aiContext` strings are kept first and untouched; the serialized gathered
 *   entries are appended, so enrichment never overwrites what the consumer already provided.
 */
export function serializeGatheredContext(gathered: (AiContextResponse | null)[]): string[] {
  return gathered
    .filter((response): response is AiContextResponse => response != null)
    .map((response) => JSON.stringify(response))
}

export function toChatRequest(request: AiCompletionRequest, gathered: (AiContextResponse | null)[]): ChatRequest {
  return {
    chatMessage: {
      message: request.message,
      type: ChatMessageTypeEnum.User
    },
    conversation: request.systemPrompt
      ? {
          conversationType: ConversationConversationTypeEnum.QAndA,
          history: [{ message: request.systemPrompt, type: ChatMessageTypeEnum.System }]
        }
      : undefined,
    requestContext: buildRequestContext(request, gathered)
  }
}

function buildRequestContext(request: AiCompletionRequest, gathered: (AiContextResponse | null)[]): RequestContext {
  return {
    agentId: request.agent.id,
    aiContext: buildAiContext(request, gathered)
  }
}

function buildAiContext(request: AiCompletionRequest, gathered: (AiContextResponse | null)[]): string[] {
  return [...request.aiContext, ...serializeGatheredContext(gathered)]
}

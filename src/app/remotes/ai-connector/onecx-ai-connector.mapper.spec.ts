import type { AiCompletionRequest, AiContextResponse } from '@onecx/integration-interface'

import { ChatMessageTypeEnum, ConversationConversationTypeEnum } from 'src/app/shared/generated'

import { serializeGatheredContext, toChatRequest } from './onecx-ai-connector.mapper'

const gatheredContext: AiContextResponse = {
  productName: 'onecx-provider',
  appId: 'app-1',
  appPath: '/app',
  context: 'I am on the agent details page'
}

const completionRequest: AiCompletionRequest = {
  agent: { id: 'agent-1', name: 'Agent A' },
  aiContext: ['caller-provided-context'],
  message: 'Do the thing',
  systemPrompt: 'Summarize in 5 sentences'
}

const completionRequestWithoutInstruction: AiCompletionRequest = {
  agent: { id: 'agent-1', name: 'Agent A' },
  aiContext: ['caller-provided-context'],
  message: 'Do the thing'
} as AiCompletionRequest

describe('serializeGatheredContext', () => {
  it('serializes each gathered response to a string', () => {
    expect(serializeGatheredContext([gatheredContext, gatheredContext])).toEqual([
      JSON.stringify(gatheredContext),
      JSON.stringify(gatheredContext)
    ])
  })

  it('drops null responses (MFEs that declined to contribute)', () => {
    expect(serializeGatheredContext([gatheredContext, null, null])).toEqual([JSON.stringify(gatheredContext)])
  })

  it('returns an empty array when nothing was gathered', () => {
    expect(serializeGatheredContext([])).toEqual([])
    expect(serializeGatheredContext([null])).toEqual([])
  })
})

describe('toChatRequest', () => {
  it('maps the caller message to a single USER chat message', () => {
    const chatRequest = toChatRequest(completionRequestWithoutInstruction, [])

    expect(chatRequest.chatMessage).toEqual({
      message: 'Do the thing',
      type: ChatMessageTypeEnum.User
    })
  })

  it('passes the agent id in the request context', () => {
    const chatRequest = toChatRequest(completionRequest, [])

    expect(chatRequest.requestContext?.agentId).toBe('agent-1')
  })

  it('passes the per-request instruction as a SYSTEM message in conversation history', () => {
    const chatRequest = toChatRequest(completionRequest, [gatheredContext])

    expect(chatRequest.chatMessage).toEqual({
      message: 'Do the thing',
      type: ChatMessageTypeEnum.User
    })
    expect(chatRequest.conversation).toEqual({
      conversationType: ConversationConversationTypeEnum.QAndA,
      history: [{ message: 'Summarize in 5 sentences', type: ChatMessageTypeEnum.System }]
    })
    expect(chatRequest.requestContext?.aiContext).toEqual(['caller-provided-context', JSON.stringify(gatheredContext)])
  })

  it('omits the instruction from aiContext when the completion request has no instruction', () => {
    const chatRequest = toChatRequest(completionRequestWithoutInstruction, [])

    expect(chatRequest.chatMessage?.message).toBe('Do the thing')
    expect(chatRequest.conversation).toBeUndefined()
    expect(chatRequest.requestContext?.aiContext).toEqual(['caller-provided-context'])
  })

  it('merges the caller aiContext (first) with the serialized gathered context (appended)', () => {
    const chatRequest = toChatRequest(completionRequestWithoutInstruction, [gatheredContext])

    expect(chatRequest.requestContext?.aiContext).toEqual(['caller-provided-context', JSON.stringify(gatheredContext)])
  })

  it('keeps the caller aiContext untouched when gathering yields only nulls', () => {
    const chatRequest = toChatRequest(completionRequestWithoutInstruction, [null])

    expect(chatRequest.requestContext?.aiContext).toEqual(['caller-provided-context'])
  })

  it('sends no conversation (one-shot completion, no state)', () => {
    const chatRequest = toChatRequest(completionRequestWithoutInstruction, [gatheredContext])

    expect(chatRequest.conversation).toBeUndefined()
    expect(chatRequest.chatMessage?.conversationId).toBeUndefined()
  })
})

import { HttpErrorResponse } from '@angular/common/http'
import { AiProviderError } from '@onecx/integration-interface'

const MESSAGE_UNREACHABLE = 'AI provider is unreachable'
const MESSAGE_TIMEOUT = 'AI provider timed out'
const MESSAGE_UNAVAILABLE = 'AI provider is unavailable'
const MESSAGE_AGENT_NOT_FOUND = 'AI agent was not found'
const MESSAGE_INVALID_RESPONSE = 'AI provider returned an invalid response'
const MESSAGE_GENERIC = 'AI provider returned an error'
const MESSAGE_REQUEST_FAILED = 'AI provider request failed'

/**
 * Maps a failed BFF call to the typed `AiProviderError` expected by the integration-interface gatherers.
 *
 * Messages are fixed texts. They never contain prompts or model output, because the BFF `ProblemDetail`
 * body is only inspected for its `errorCode`.
 */
export function toAiProviderError(error: unknown): AiProviderError {
  if (!(error instanceof HttpErrorResponse)) {
    return new AiProviderError('PROVIDER_ERROR', MESSAGE_REQUEST_FAILED)
  }

  const status = error.status
  const errorCode = readErrorCode(error.error)

  if (status === 0) {
    return new AiProviderError('PROVIDER_ERROR', MESSAGE_UNREACHABLE, { status, retryable: true })
  }
  if (errorCode === 'RUNTIME_TIMEOUT' || status === 504) {
    return new AiProviderError('TIMEOUT', MESSAGE_TIMEOUT, { status, retryable: true })
  }
  if (errorCode === 'RUNTIME_UNAVAILABLE' || status === 503) {
    return new AiProviderError('PROVIDER_ERROR', MESSAGE_UNAVAILABLE, { status, retryable: true })
  }
  if (errorCode === 'AGENT_NOT_FOUND') {
    return new AiProviderError('PROVIDER_ERROR', MESSAGE_AGENT_NOT_FOUND, { status, retryable: false })
  }
  if (errorCode === 'RUNTIME_INVALID_RESPONSE') {
    return new AiProviderError('PROVIDER_ERROR', MESSAGE_INVALID_RESPONSE, { status, retryable: false })
  }
  return new AiProviderError('PROVIDER_ERROR', MESSAGE_GENERIC, { status, retryable: false })
}

function readErrorCode(body: unknown): string | undefined {
  if (body != null && typeof body === 'object' && 'errorCode' in body && typeof body.errorCode === 'string') {
    return body.errorCode
  }
  return undefined
}

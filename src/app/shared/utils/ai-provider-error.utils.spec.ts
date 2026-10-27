import { HttpErrorResponse } from '@angular/common/http'
import { AiProviderError } from '@onecx/integration-interface'

import { toAiProviderError } from './ai-provider-error.utils'

function httpError(status: number, body: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: body })
}

describe('toAiProviderError', () => {
  it('maps a non-HTTP error to a non-retryable PROVIDER_ERROR', () => {
    const result = toAiProviderError(new Error('boom'))
    expect(result).toBeInstanceOf(AiProviderError)
    expect(result).toMatchObject({ code: 'PROVIDER_ERROR', retryable: false })
    expect(result.status).toBeUndefined()
  })

  it('maps a network failure (status 0) to a retryable PROVIDER_ERROR', () => {
    expect(toAiProviderError(httpError(0))).toMatchObject({ code: 'PROVIDER_ERROR', retryable: true, status: 0 })
  })

  it('maps RUNTIME_TIMEOUT and HTTP 504 to a retryable TIMEOUT', () => {
    expect(toAiProviderError(httpError(504, { errorCode: 'RUNTIME_TIMEOUT' }))).toMatchObject({
      code: 'TIMEOUT',
      retryable: true,
      status: 504
    })
    expect(toAiProviderError(httpError(504))).toMatchObject({ code: 'TIMEOUT', retryable: true })
  })

  it('maps RUNTIME_UNAVAILABLE and HTTP 503 to a retryable PROVIDER_ERROR', () => {
    expect(toAiProviderError(httpError(503, { errorCode: 'RUNTIME_UNAVAILABLE' }))).toMatchObject({
      code: 'PROVIDER_ERROR',
      retryable: true,
      status: 503
    })
    expect(toAiProviderError(httpError(503))).toMatchObject({ code: 'PROVIDER_ERROR', retryable: true })
  })

  it('maps AGENT_NOT_FOUND and RUNTIME_INVALID_RESPONSE to non-retryable PROVIDER_ERRORs', () => {
    expect(toAiProviderError(httpError(404, { errorCode: 'AGENT_NOT_FOUND' }))).toMatchObject({
      code: 'PROVIDER_ERROR',
      retryable: false,
      status: 404
    })
    expect(toAiProviderError(httpError(502, { errorCode: 'RUNTIME_INVALID_RESPONSE' }))).toMatchObject({
      code: 'PROVIDER_ERROR',
      retryable: false,
      status: 502
    })
  })

  it('maps an unknown error code to a generic non-retryable PROVIDER_ERROR with the status', () => {
    expect(toAiProviderError(httpError(500, { errorCode: 'SOMETHING_ELSE' }))).toMatchObject({
      code: 'PROVIDER_ERROR',
      retryable: false,
      status: 500
    })
  })

  it('handles a non-JSON error body by using only the status', () => {
    expect(toAiProviderError(httpError(500, '<html>oops</html>'))).toMatchObject({
      code: 'PROVIDER_ERROR',
      retryable: false,
      status: 500
    })
  })

  it('never copies the ProblemDetail text into the message', () => {
    const result = toAiProviderError(
      httpError(502, { errorCode: 'RUNTIME_ERROR', detail: 'secret prompt text from model' })
    )
    expect(result.message).not.toContain('secret prompt text')
  })
})

import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { of, throwError } from 'rxjs'

import { AiContextResponse, type AiCompletionRequest } from '@onecx/integration-interface'

import { APIConfiguration, DispatchService } from 'src/app/shared/generated'

import { OneCXAiConnectorComponent } from './onecx-ai-connector.component'

jest.mock('@onecx/integration-interface', () => {
  const actual = jest.requireActual('@onecx/integration-interface')
  class AiCompletionGatherer {
    static instances: AiCompletionGatherer[] = []
    destroyed = false
    constructor(public cb: (request: AiCompletionRequest) => Promise<unknown>) {
      AiCompletionGatherer.instances.push(this)
    }
    gather(): Promise<unknown[]> {
      throw new Error('not used in tests')
    }
    destroy(): void {
      this.destroyed = true
    }
  }
  class AiContextGatherer {
    static instances: AiContextGatherer[] = []
    destroyed = false
    gather: jest.Mock
    constructor(_cb: unknown) {
      this.gather = jest.fn().mockResolvedValue([])
      AiContextGatherer.instances.push(this)
    }
    destroy(): void {
      this.destroyed = true
    }
  }
  return { ...actual, AiCompletionGatherer, AiContextGatherer }
})

const { AiCompletionGatherer, AiContextGatherer } = require('@onecx/integration-interface') as {
  AiCompletionGatherer: new (...args: unknown[]) => {
    cb: (r: AiCompletionRequest) => Promise<unknown>
    destroyed: boolean
    destroy: () => void
  }
  AiContextGatherer: new (...args: unknown[]) => { gather: jest.Mock; destroyed: boolean; destroy: () => void }
}

const gatheredContext: AiContextResponse = {
  productName: 'onecx-provider',
  appId: 'app-1',
  appPath: '/app',
  context: 'on the agent page'
}

const request: AiCompletionRequest = {
  agent: { id: 'agent-1', name: 'Agent A' },
  aiContext: [],
  message: 'Do the thing',
  systemPrompt: 'You are a helpful agent'
}

const remoteComponentConfig = {
  appId: 'onecx-ai-provider-ui',
  productName: 'OneCX AI Provider',
  baseUrl: 'http://localhost:4200',
  permissions: []
}

describe('OneCXAiConnectorComponent', () => {
  let fixture: ComponentFixture<OneCXAiConnectorComponent>
  let component: OneCXAiConnectorComponent
  let dispatchService: { chat: jest.Mock; configuration: APIConfiguration }

  beforeEach(() => {
    ;(AiCompletionGatherer as unknown as { instances: unknown[] }).instances.length = 0
    ;(AiContextGatherer as unknown as { instances: unknown[] }).instances.length = 0

    dispatchService = {
      chat: jest.fn(),
      configuration: new APIConfiguration({ credentials: { token: 'test-token' } })
    }

    TestBed.configureTestingModule({
      imports: [OneCXAiConnectorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DispatchService, useValue: dispatchService }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(OneCXAiConnectorComponent)
    component = fixture.componentInstance
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('registers a context gatherer and a completion gatherer on init', () => {
    component.ocxInitRemoteComponent(remoteComponentConfig)
    expect((AiContextGatherer as unknown as { instances: unknown[] }).instances).toHaveLength(1)
    expect((AiCompletionGatherer as unknown as { instances: unknown[] }).instances).toHaveLength(1)
    expect(dispatchService.configuration.basePath).toBe('http://localhost:4200/bff')
    expect(dispatchService.configuration.credentials).toEqual({ token: 'test-token' })
  })

  it('initializes gatherers when the remote component config input is set', () => {
    component.ocxRemoteComponentConfig = remoteComponentConfig

    expect((AiContextGatherer as unknown as { instances: unknown[] }).instances).toHaveLength(1)
    expect((AiCompletionGatherer as unknown as { instances: unknown[] }).instances).toHaveLength(1)
  })

  it('does not double-register when initialized twice', () => {
    component.ocxInitRemoteComponent(remoteComponentConfig)
    component.ocxInitRemoteComponent(remoteComponentConfig)
    expect((AiCompletionGatherer as unknown as { instances: unknown[] }).instances).toHaveLength(1)
  })

  it('initializes the context gatherer when only the completion gatherer exists', () => {
    Object.assign(component, { aiCompletionGatherer: { destroy: jest.fn() } })

    component.ocxInitRemoteComponent(remoteComponentConfig)

    expect((AiContextGatherer as unknown as { instances: unknown[] }).instances).toHaveLength(1)
    expect((AiCompletionGatherer as unknown as { instances: unknown[] }).instances).toHaveLength(0)
  })

  it('initializes the completion gatherer when only the context gatherer exists', () => {
    Object.assign(component, { aiContextGatherer: { destroy: jest.fn() } })

    component.ocxInitRemoteComponent(remoteComponentConfig)

    expect((AiContextGatherer as unknown as { instances: unknown[] }).instances).toHaveLength(0)
    expect((AiCompletionGatherer as unknown as { instances: unknown[] }).instances).toHaveLength(1)
  })

  it('gathers context with the agent name, maps the request and returns the BFF message', async () => {
    dispatchService.chat.mockReturnValue(of({ message: 'BFF says hi' } as never))
    component.ocxInitRemoteComponent(remoteComponentConfig)

    const ctxGatherer = (AiContextGatherer as unknown as { instances: { gather: jest.Mock }[] }).instances[0]
    ctxGatherer.gather.mockResolvedValue([gatheredContext])
    const answerer = (
      AiCompletionGatherer as unknown as {
        instances: { cb: (r: AiCompletionRequest) => Promise<unknown> }[]
      }
    ).instances[0]

    const response = (await answerer.cb(request)) as { message: string } | null

    expect(ctxGatherer.gather).toHaveBeenCalledWith({ agent: { name: 'Agent A' } })
    expect(dispatchService.chat).toHaveBeenCalledTimes(1)
    expect(dispatchService.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        requestContext: expect.objectContaining({ agentId: 'agent-1' }),
        chatMessage: expect.objectContaining({ message: 'Do the thing', type: 'USER' }),
        conversation: expect.objectContaining({
          history: [{ message: 'You are a helpful agent', type: 'SYSTEM' }]
        })
      })
    )
    expect(response).toEqual({ message: 'BFF says hi' })
  })

  it('handles a completion when the context gatherer is no longer available', async () => {
    dispatchService.chat.mockReturnValue(of({ message: 'BFF says hi' } as never))
    component.ocxInitRemoteComponent(remoteComponentConfig)

    const answerer = (
      AiCompletionGatherer as unknown as {
        instances: { cb: (r: AiCompletionRequest) => Promise<unknown> }[]
      }
    ).instances[0]
    component.ngOnDestroy()

    const response = await answerer.cb(request)

    expect(dispatchService.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        chatMessage: expect.objectContaining({ message: 'Do the thing', type: 'USER' }),
        conversation: expect.objectContaining({
          history: [{ message: 'You are a helpful agent', type: 'SYSTEM' }]
        }),
        requestContext: expect.objectContaining({ aiContext: [] })
      })
    )
    expect(response).toEqual({ message: 'BFF says hi' })
  })

  it('returns null (no response) when the BFF call fails, instead of throwing', async () => {
    dispatchService.chat.mockReturnValue(throwError(() => new Error('BFF unavailable')))
    component.ocxInitRemoteComponent(remoteComponentConfig)

    const answerer = (
      AiCompletionGatherer as unknown as {
        instances: { cb: (r: AiCompletionRequest) => Promise<unknown> }[]
      }
    ).instances[0]
    const response = await answerer.cb(request)

    expect(response).toBeNull()
  })

  it('returns null when the BFF response has no message', async () => {
    dispatchService.chat.mockReturnValue(of(undefined as never))
    component.ocxInitRemoteComponent(remoteComponentConfig)

    const answerer = (
      AiCompletionGatherer as unknown as {
        instances: { cb: (r: AiCompletionRequest) => Promise<unknown> }[]
      }
    ).instances[0]
    const response = await answerer.cb(request)

    expect(response).toBeNull()
  })

  it('preserves an empty message returned by the BFF', async () => {
    dispatchService.chat.mockReturnValue(of({ message: '' } as never))
    component.ocxInitRemoteComponent(remoteComponentConfig)

    const answerer = (
      AiCompletionGatherer as unknown as {
        instances: { cb: (r: AiCompletionRequest) => Promise<unknown> }[]
      }
    ).instances[0]
    const response = await answerer.cb(request)

    expect(response).toEqual({ message: '' })
  })

  it('destroys both gatherers on ngOnDestroy', () => {
    component.ocxInitRemoteComponent(remoteComponentConfig)
    component.ngOnDestroy()

    expect((AiContextGatherer as unknown as { instances: { destroyed: boolean }[] }).instances[0].destroyed).toBe(true)
    expect((AiCompletionGatherer as unknown as { instances: { destroyed: boolean }[] }).instances[0].destroyed).toBe(
      true
    )
  })

  it('destroys nothing without error when never initialized', () => {
    expect(() => component.ngOnDestroy()).not.toThrow()
  })
})

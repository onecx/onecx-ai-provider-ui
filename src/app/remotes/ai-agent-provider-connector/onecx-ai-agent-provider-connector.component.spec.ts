import { ComponentFixture, TestBed } from '@angular/core/testing'
import { of, throwError } from 'rxjs'

import {
  AgentFilterKeyEnum,
  AgentPageResult,
  AgentService,
  AgentStatus,
  APIConfiguration
} from 'src/app/shared/generated'

import type { AiAgentRequest, AiAgentResponse } from '@onecx/integration-interface'
import { OneCXAiAgentProviderConnectorComponent } from './onecx-ai-agent-provider-connector.component'

jest.mock('@onecx/integration-interface', () => {
  const actual = jest.requireActual('@onecx/integration-interface')
  class AiAgentGatherer {
    static instances: AiAgentGatherer[] = []
    destroyed = false
    readonly name = 'aiAgent'
    readonly version = 1
    constructor(public cb: (request: unknown) => Promise<unknown>) {
      AiAgentGatherer.instances.push(this)
    }
    destroy(): void {
      this.destroyed = true
    }
  }
  return { ...actual, AiAgentGatherer }
})

const { AiAgentGatherer: Gatherer } = require('@onecx/integration-interface') as {
  AiAgentGatherer: {
    instances: {
      name: string
      version: number
      cb: (r: AiAgentRequest) => Promise<AiAgentResponse[] | null>
      destroyed: boolean
    }[]
  }
}

const remoteComponentConfig = {
  appId: 'onecx-ai-provider-ui',
  productName: 'OneCX AI Provider',
  baseUrl: 'http://localhost:4200',
  permissions: []
}

const page = (stream: AgentPageResult['stream'], totalPages: number): AgentPageResult => ({
  stream,
  totalPages,
  number: 0,
  size: 100,
  totalElements: stream?.length ?? 0
})

describe('OneCXAiAgentProviderConnectorComponent', () => {
  let fixture: ComponentFixture<OneCXAiAgentProviderConnectorComponent>
  let component: OneCXAiAgentProviderConnectorComponent
  let agentService: { findAgentBySearchCriteria: jest.Mock; configuration: APIConfiguration }

  beforeEach(() => {
    Gatherer.instances.length = 0
    agentService = {
      findAgentBySearchCriteria: jest.fn(),
      configuration: new APIConfiguration({ basePath: 'http://old' })
    }

    TestBed.configureTestingModule({
      imports: [OneCXAiAgentProviderConnectorComponent],
      providers: [{ provide: AgentService, useValue: agentService }]
    })

    fixture = TestBed.createComponent(OneCXAiAgentProviderConnectorComponent)
    component = fixture.componentInstance
    component.ocxRemoteComponentConfig = remoteComponentConfig
  })

  afterEach(() => {
    fixture.destroy()
  })

  function getGatherer() {
    const gatherer = Gatherer.instances[0]
    expect(gatherer).toBeDefined()
    return gatherer
  }

  it('registers an aiAgent gatherer with version 1', () => {
    expect(Gatherer.instances).toHaveLength(1)
    expect(getGatherer().name).toBe('aiAgent')
    expect(getGatherer().version).toBe(1)
  })

  it('points the AgentService at the BFF base path', () => {
    expect(agentService.configuration.basePath).toBe('http://localhost:4200/bff')
  })

  it('does not create a second gatherer when configured again', () => {
    component.ocxRemoteComponentConfig = remoteComponentConfig
    expect(Gatherer.instances).toHaveLength(1)
  })

  it('fetches only LIVE agents, page by page, until all pages are read', async () => {
    agentService.findAgentBySearchCriteria
      .mockReturnValueOnce(of(page([{ id: 'a1', name: 'A1' }], 2)))
      .mockReturnValueOnce(of(page([{ id: 'a2', name: 'A2' }], 2)))

    const result = await getGatherer().cb({})

    expect(agentService.findAgentBySearchCriteria).toHaveBeenNthCalledWith(1, {
      status: AgentStatus.Live,
      pageNumber: 0,
      pageSize: 100
    })
    expect(agentService.findAgentBySearchCriteria).toHaveBeenNthCalledWith(2, {
      status: AgentStatus.Live,
      pageNumber: 1,
      pageSize: 100
    })
    expect(result?.map((a) => a.id)).toEqual(['a1', 'a2'])
  })

  it('treats a page without stream or totalPages as empty', async () => {
    agentService.findAgentBySearchCriteria.mockReturnValueOnce(
      of({ number: 0, size: 100, totalElements: 0 } as AgentPageResult)
    )
    await expect(getGatherer().cb({})).resolves.toEqual([])
    expect(agentService.findAgentBySearchCriteria).toHaveBeenCalledTimes(1)
  })

  it('returns no agents when the provider has none', async () => {
    agentService.findAgentBySearchCriteria.mockReturnValueOnce(of(page([], 0)))
    await expect(getGatherer().cb({})).resolves.toEqual([])
  })

  it('filters the agents by the requested appId', async () => {
    agentService.findAgentBySearchCriteria.mockReturnValueOnce(
      of(
        page(
          [
            { id: 'a1', name: 'A1', filter: { key: AgentFilterKeyEnum.AppId, value: 'app-1' } },
            { id: 'a2', name: 'A2', filter: { key: AgentFilterKeyEnum.AppId, value: 'app-2' } }
          ],
          1
        )
      )
    )

    const result = await getGatherer().cb({ appId: 'app-1' })
    expect(result?.map((a) => a.id)).toEqual(['a1'])
  })

  it('returns null when the BFF call fails', async () => {
    agentService.findAgentBySearchCriteria.mockReturnValueOnce(throwError(() => new Error('boom')))
    await expect(getGatherer().cb({})).resolves.toBeNull()
  })

  it('destroys the gatherer on destroy', () => {
    fixture.destroy()
    expect(getGatherer().destroyed).toBe(true)
  })
})

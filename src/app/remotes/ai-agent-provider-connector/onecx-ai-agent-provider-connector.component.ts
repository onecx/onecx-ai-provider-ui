import { Location } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, Input, inject, type OnDestroy } from '@angular/core'
import { Observable, firstValueFrom, map, of, switchMap } from 'rxjs'

import { Gatherer } from '@onecx/accelerator'
import type { RemoteComponentConfig, ocxRemoteComponent, ocxRemoteWebcomponent } from '@onecx/angular-remote-components'

import { AgentAbstract, AgentPageResult, AgentService, AgentStatus, APIConfiguration } from 'src/app/shared/generated'
import { createLogger } from 'src/app/shared/utils/logger.utils'
import { environment } from 'src/environments/environment'

import { toAiAgentResponses } from './onecx-ai-agent-provider-connector.mapper'
import type { AiAgentRequest, AiAgentResponse } from './onecx-ai-agent-provider-connector.model'

const AGENT_PAGE_SIZE = 100

/**
 * OneCXAiAgentProviderConnector -- the headless provider of the AI agent gatherer.
 *
 * This remote component has no UI. It answers `AiAgentRequest`s published by consumers through the
 * `aiAgent` gatherer (version 1). For every request it fetches all LIVE agents from the onecx-ai-provider BFF
 * (`POST /agents/search`, page by page) via the generated `AgentService`, maps them to `AiAgentResponse`s and
 * filters them by `appId` when one is given.
 */
@Component({
  selector: 'app-onecx-ai-agent-provider-connector',
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OneCXAiAgentProviderConnectorComponent implements ocxRemoteComponent, ocxRemoteWebcomponent, OnDestroy {
  private readonly destroyRef = inject(DestroyRef)
  private readonly agentService = inject(AgentService)
  private readonly logger = createLogger('OneCXAiAgentProviderConnectorComponent')

  private aiAgentGatherer: Gatherer<AiAgentRequest, AiAgentResponse[] | null> | undefined

  @Input()
  set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }

  constructor() {
    this.destroyRef.onDestroy(() => this.ngOnDestroy())
    //temporary fix to avoid id collisions when multiple gatherer classes are used
    // remove as soon as onecx-portal-libs version is higher than v6.29.0, v7.13.1, v8.13.0, v9.0.0
    Gatherer['id'] = 1000
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    const currentConfiguration = this.agentService.configuration
    this.agentService.configuration = new APIConfiguration({
      basePath: Location.joinWithSlash(config.baseUrl, environment.apiPrefix),
      credentials: currentConfiguration.credentials,
      encodeParam: currentConfiguration.encodeParam
    })

    if (!this.aiAgentGatherer) {
      this.aiAgentGatherer = new Gatherer<AiAgentRequest, AiAgentResponse[] | null>('aiAgent', 1, (request) =>
        this.handleAgentRequest(request)
      )
    }
  }

  ngOnDestroy(): void {
    this.aiAgentGatherer?.destroy()
    this.aiAgentGatherer = undefined
  }

  private async handleAgentRequest(request: AiAgentRequest): Promise<AiAgentResponse[] | null> {
    try {
      const agents = await this.fetchLiveAgents()
      return toAiAgentResponses(agents, request.appId)
    } catch (error) {
      this.logger.error('Failed to fetch AI agents, returning no response', error)
      return null
    }
  }

  private fetchLiveAgents(): Promise<AgentAbstract[]> {
    return firstValueFrom(this.fetchLiveAgentsPage(0))
  }

  private fetchLiveAgentsPage(pageNumber: number): Observable<AgentAbstract[]> {
    return this.agentService
      .findAgentBySearchCriteria({
        status: AgentStatus.Live,
        pageNumber,
        pageSize: AGENT_PAGE_SIZE
      })
      .pipe(
        switchMap((page: AgentPageResult) => {
          const agents = page.stream ?? []
          const hasNextPage = pageNumber + 1 < (page.totalPages ?? 0)
          return hasNextPage
            ? this.fetchLiveAgentsPage(pageNumber + 1).pipe(map((nextAgents) => [...agents, ...nextAgents]))
            : of(agents)
        })
      )
  }
}

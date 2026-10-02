import { Location } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, Input, inject, type OnDestroy } from '@angular/core'
import { firstValueFrom } from 'rxjs'

import type { RemoteComponentConfig, ocxRemoteComponent, ocxRemoteWebcomponent } from '@onecx/angular-remote-components'
import {
  AiCompletionGatherer,
  AiContextGatherer,
  type AiCompletionRequest,
  type AiCompletionResponse,
  type AiContextResponse
} from '@onecx/integration-interface'

import { APIConfiguration, DispatchService } from 'src/app/shared/generated'
import { createLogger } from 'src/app/shared/utils/logger.utils'
import { environment } from 'src/environments/environment'

import { toChatRequest } from './onecx-ai-connector.mapper'

/**
 * OneCXAiConnector -- the headless central orchestration layer of the Inline AI feature.
 *
 * This remote component has no UI. It answers `AiCompletionRequest`s published by consumers
 * (e.g. the future onecx-ai-assist) through the `AiCompletionGatherer`. For every request it:
 *
 *   1. gathers additional context from the other MFEs via the `AiContextGatherer` (passing the
 *      agent information from the original request),
 *   2. merges that context with the original request and maps the result to the BFF chat request
 *      (see `onecx-ai-connector.mapper.ts` for the documented field mapping),
 *   3. sends the request to the onecx-ai-provider BFF (`POST /dispatch/chat`) via the generated
 *      `DispatchService`,
 *   4. returns the produced message to the requesting instance as an `AiCompletionResponse`.
 *
 */
@Component({
  selector: 'app-onecx-ai-connector',
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OneCXAiConnectorComponent implements ocxRemoteComponent, ocxRemoteWebcomponent, OnDestroy {
  private readonly destroyRef = inject(DestroyRef)
  private readonly dispatchService = inject(DispatchService)
  private readonly logger = createLogger('OneCXAiConnectorComponent')

  private aiCompletionGatherer: AiCompletionGatherer | undefined
  private aiContextGatherer: AiContextGatherer | undefined

  @Input()
  set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }

  constructor() {
    this.destroyRef.onDestroy(() => this.ngOnDestroy())
  }

  ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    const currentConfiguration = this.dispatchService.configuration
    this.dispatchService.configuration = new APIConfiguration({
      basePath: Location.joinWithSlash(config.baseUrl, environment.apiPrefix),
      credentials: currentConfiguration.credentials,
      encodeParam: currentConfiguration.encodeParam
    })

    if (!this.aiContextGatherer) {
      this.aiContextGatherer = new AiContextGatherer(() => Promise.resolve(null))
    }

    if (!this.aiCompletionGatherer) {
      this.aiCompletionGatherer = new AiCompletionGatherer((request) => this.handleCompletion(request))
    }
  }

  ngOnDestroy(): void {
    this.aiCompletionGatherer?.destroy()
    this.aiContextGatherer?.destroy()
    this.aiCompletionGatherer = undefined
    this.aiContextGatherer = undefined
  }

  private async handleCompletion(request: AiCompletionRequest): Promise<AiCompletionResponse | null> {
    try {
      const gathered: (AiContextResponse | null)[] =
        (await this.aiContextGatherer?.gather({
          agent: { name: request.agent.name }
        })) ?? []

      const chatRequest = toChatRequest(request, gathered)

      const response = await firstValueFrom(this.dispatchService.chat(chatRequest))

      if (response?.message == null) {
        return null
      }
      return { message: response.message }
    } catch (error) {
      this.logger.error('Failed to handle AI completion request, returning no response', error)
      return null
    }
  }
}

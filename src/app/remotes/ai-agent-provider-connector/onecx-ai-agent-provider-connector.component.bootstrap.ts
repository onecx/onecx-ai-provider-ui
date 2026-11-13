import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { importProvidersFrom } from '@angular/core'

import { AngularAuthModule } from '@onecx/angular-auth'
import { bootstrapRemoteComponent } from '@onecx/angular-webcomponents'
import { AppStateService, ConfigurationService } from '@onecx/angular-integration-interface'

import { APIConfiguration } from 'src/app/shared/generated'
import { apiConfigProvider } from 'src/app/shared/utils/apiConfigProvider.utils'
import { environment } from 'src/environments/environment'
import { OneCXAiAgentProviderConnectorComponent } from './onecx-ai-agent-provider-connector.component'

const apiConfigurationProvider = {
  provide: APIConfiguration,
  useFactory: apiConfigProvider,
  deps: [ConfigurationService, AppStateService]
}

bootstrapRemoteComponent(
  OneCXAiAgentProviderConnectorComponent,
  'ocx-ai-agent-provider-connector-component',
  environment.production,
  [provideHttpClient(withInterceptorsFromDi()), importProvidersFrom(AngularAuthModule), apiConfigurationProvider]
)

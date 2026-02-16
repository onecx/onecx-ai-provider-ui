import { AppStateService, ConfigurationService, PortalApiConfiguration } from '@onecx/portal-integration-angular'
import { environment } from 'src/environments/environment'
import { APIConfiguration } from '../generated/configuration'

export function apiConfigProvider(configService: ConfigurationService, appStateService: AppStateService) {
  return new PortalApiConfiguration(APIConfiguration, environment.apiPrefix, configService, appStateService)
}

import { Configuration, MCPServer, Provider } from '../../../shared/generated'

export interface ConfigurationDetailsViewModel {
  details: Configuration | undefined
  detailsLoadingIndicator: boolean
  detailsLoaded: boolean

  Providers: Provider[] | undefined
  ProvidersLoaded: boolean
  ProvidersLoadingIndicator: boolean

  MCPServers: MCPServer[] | undefined
  MCPServersLoaded: boolean
  MCPServersLoadingIndicator: boolean
  
  backNavigationPossible: boolean
  editMode: boolean
  isSubmitting: boolean
}

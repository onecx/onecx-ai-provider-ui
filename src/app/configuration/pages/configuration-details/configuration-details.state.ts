import { Configuration, MCPServer, Provider } from '../../../shared/generated'

export interface ConfigurationDetailsState {
  details: Configuration | undefined
  detailsLoadingIndicator: boolean
  detailsLoaded: boolean

  Providers: Provider[] | undefined
  ProvidersLoaded: boolean
  ProvidersLoadingIndicator: boolean

  mcpServers: MCPServer[] | undefined
  mcpServersLoaded: boolean
  mcpServersLoadingIndicator: boolean
  
  backNavigationPossible: boolean
  editMode: boolean
  isSubmitting: boolean
}

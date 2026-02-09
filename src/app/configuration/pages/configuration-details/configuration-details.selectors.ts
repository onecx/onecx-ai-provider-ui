import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'
import { Configuration, MCPServer, Provider } from '../../../shared/generated'
import { configurationFeature } from '../../configuration.reducers'
import { initialState } from './configuration-details.reducers'
import { ConfigurationDetailsViewModel } from './configuration-details.viewmodel'

export const configurationDetailsSelectors = createChildSelectors(configurationFeature.selectDetails, initialState)

export const selectConfigurationDetailsViewModel = createSelector(
  configurationDetailsSelectors.selectDetails,
  configurationDetailsSelectors.selectDetailsLoadingIndicator,
  configurationDetailsSelectors.selectDetailsLoaded,
  configurationDetailsSelectors.selectProviders,
  configurationDetailsSelectors.selectProvidersLoadingIndicator,
  configurationDetailsSelectors.selectProvidersLoaded,
  configurationDetailsSelectors.selectMcpServers,
  configurationDetailsSelectors.selectMcpServersLoadingIndicator,
  configurationDetailsSelectors.selectMcpServersLoaded,
  selectBackNavigationPossible,
  configurationDetailsSelectors.selectEditMode,
  configurationDetailsSelectors.selectIsSubmitting,
  (
    details: Configuration | undefined,
    detailsLoadingIndicator: boolean,
    detailsLoaded: boolean,
    Providers: Provider[] | undefined,
    ProvidersLoadingIndicator: boolean,
    ProvidersLoaded: boolean,
    MCPServers: MCPServer[] | undefined,
    MCPServersLoadingIndicator: boolean,
    MCPServersLoaded: boolean,
    backNavigationPossible: boolean,
    editMode: boolean,
    isSubmitting: boolean
  ): ConfigurationDetailsViewModel => ({
    details,
    detailsLoadingIndicator,
    detailsLoaded,
    Providers,
    ProvidersLoadingIndicator,
    ProvidersLoaded,
    MCPServers,
    MCPServersLoaded,
    MCPServersLoadingIndicator,
    backNavigationPossible,
    editMode,
    isSubmitting
  })
)

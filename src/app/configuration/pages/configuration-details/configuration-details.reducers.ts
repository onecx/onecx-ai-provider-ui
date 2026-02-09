import { createReducer, on } from '@ngrx/store'
import { ConfigurationDetailsActions } from './configuration-details.actions'
import { ConfigurationDetailsState } from './configuration-details.state'

export const initialState: ConfigurationDetailsState = {
  details: undefined,
  detailsLoadingIndicator: true,
  detailsLoaded: false,
  Providers: [],
  ProvidersLoadingIndicator: true,
  ProvidersLoaded: false,
  mcpServers: [],
  mcpServersLoadingIndicator: true,
  mcpServersLoaded: false,
  backNavigationPossible: true,
  editMode: false,
  isSubmitting: false
}

export const configurationDetailsReducer = createReducer(
  initialState,
  on(
    ConfigurationDetailsActions.configurationDetailsReceived,
    (state: ConfigurationDetailsState, { details }): ConfigurationDetailsState => ({
      ...state,
      details,
      detailsLoadingIndicator: false,
      detailsLoaded: true
    })
  ),
  on(
    ConfigurationDetailsActions.configurationDetailsLoadingFailed,
    (state: ConfigurationDetailsState): ConfigurationDetailsState => ({
      ...state,
      details: undefined,
      detailsLoadingIndicator: false,
      detailsLoaded: false
    })
  ),
  on(
    ConfigurationDetailsActions.configurationProvidersReceived,
    (state: ConfigurationDetailsState, { providers }): ConfigurationDetailsState => ({
      ...state,
      Providers: providers,
      ProvidersLoadingIndicator: false,
      ProvidersLoaded: true
    })
  ),
  on(
    ConfigurationDetailsActions.configurationProvidersLoadingFailed,
    (state: ConfigurationDetailsState): ConfigurationDetailsState => ({
      ...state,
      Providers: [],
      ProvidersLoadingIndicator: false,
      ProvidersLoaded: false
    })
  ),
  on(
    ConfigurationDetailsActions.configurationMCPServersReceived,
    (state: ConfigurationDetailsState, { MCPServers }): ConfigurationDetailsState => ({
      ...state,
      mcpServers: MCPServers,
      mcpServersLoadingIndicator: false,
      mcpServersLoaded: true
    })
  ),
  on(
    ConfigurationDetailsActions.configurationMCPServersLoadingFailed,
    (state: ConfigurationDetailsState): ConfigurationDetailsState => ({
      ...state,
      mcpServers: [],
      mcpServersLoadingIndicator: false,
      mcpServersLoaded: false
    })
  ),
  on(
    ConfigurationDetailsActions.navigatedToDetailsPage,
    (): ConfigurationDetailsState => ({
      ...initialState
    })
  ),
  on(
    ConfigurationDetailsActions.editButtonClicked,
    (state: ConfigurationDetailsState): ConfigurationDetailsState => ({
      ...state,
      editMode: true
    })
  ),
  on(
    ConfigurationDetailsActions.saveButtonClicked,
    (state: ConfigurationDetailsState, { details }): ConfigurationDetailsState => ({
      ...state,
      details,
      editMode: false,
      isSubmitting: true
    })
  ),
  on(
    ConfigurationDetailsActions.navigateBackButtonClicked,
    (state: ConfigurationDetailsState): ConfigurationDetailsState => ({
      ...state
    })
  ),
  on(
    ConfigurationDetailsActions.cancelEditConfirmClicked,
    ConfigurationDetailsActions.cancelEditNotDirty,
    ConfigurationDetailsActions.updateConfigurationCancelled,
    ConfigurationDetailsActions.updateConfigurationSucceeded,
    (state: ConfigurationDetailsState): ConfigurationDetailsState => ({
      ...state,
      editMode: false,
      isSubmitting: false
    })
  ),
  on(
    ConfigurationDetailsActions.updateConfigurationFailed,
    (state: ConfigurationDetailsState): ConfigurationDetailsState => ({
      ...state,
      isSubmitting: false
    })
  )
)

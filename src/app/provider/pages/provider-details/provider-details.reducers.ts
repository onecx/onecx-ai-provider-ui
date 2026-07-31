import { createReducer, on } from '@ngrx/store'

import { ProviderDetailsActions } from './provider-details.actions'
import { ProviderDetailsState } from './provider-details.state'

export const initialState: ProviderDetailsState = {
  details: undefined,
  models: [],
  modelsLoadingIndicator: true,
  modelsLoaded: false,
  isSubmitting: false,
  modelMutationInProgress: false,
  editMode: false,
  isApiKeyHidden: true
}

export const ProviderDetailsReducer = createReducer(
  initialState,
  on(
    ProviderDetailsActions.providerDetailsReceived,
    (state: ProviderDetailsState, { details }): ProviderDetailsState => ({
      ...state,
      details
    })
  ),
  on(ProviderDetailsActions.providerDetailsLoadingFailed, (state: ProviderDetailsState): ProviderDetailsState => ({
    ...state,
    details: undefined
  })),
  on(ProviderDetailsActions.providerUpdateRequested, (state: ProviderDetailsState): ProviderDetailsState => ({
    ...state,
    isSubmitting: true
  })),
  on(
    ProviderDetailsActions.providerUpdateSucceeded,
    (state: ProviderDetailsState, { details }): ProviderDetailsState => ({
      ...state,
      details,
      editMode: false,
      isSubmitting: false
    })
  ),
  on(ProviderDetailsActions.providerUpdateFailed, (state: ProviderDetailsState): ProviderDetailsState => ({
    ...state,
    isSubmitting: false
  })),
  on(ProviderDetailsActions.providerModelsLoadRequested, (state: ProviderDetailsState): ProviderDetailsState => ({
    ...state,
    modelsLoadingIndicator: true
  })),
  on(
    ProviderDetailsActions.providerModelsReceived,
    (state: ProviderDetailsState, { models }): ProviderDetailsState => ({
      ...state,
      models,
      modelsLoadingIndicator: false,
      modelsLoaded: true
    })
  ),
  on(ProviderDetailsActions.providerModelsLoadingFailed, (state: ProviderDetailsState): ProviderDetailsState => ({
    ...state,
    models: [],
    modelsLoadingIndicator: false,
    modelsLoaded: false
  })),
  on(
    ProviderDetailsActions.providerModelCreateClicked,
    ProviderDetailsActions.providerModelDeleteClicked,
    (state: ProviderDetailsState): ProviderDetailsState => ({
      ...state,
      modelMutationInProgress: true
    })
  ),
  on(
    ProviderDetailsActions.providerModelCreateSucceeded,
    ProviderDetailsActions.providerModelDeleteSucceeded,
    ProviderDetailsActions.providerModelCreateFailed,
    ProviderDetailsActions.providerModelDeleteFailed,
    (state: ProviderDetailsState): ProviderDetailsState => ({
      ...state,
      modelMutationInProgress: false
    })
  ),
  on(ProviderDetailsActions.navigatedToDetailsPage, (): ProviderDetailsState => ({
    ...initialState
  })),
  on(
    ProviderDetailsActions.providerDetailsEditModeSet,
    (state: ProviderDetailsState, { editMode }): ProviderDetailsState => ({
      ...state,
      editMode
    })
  ),
  on(ProviderDetailsActions.apiKeyVisibilityToggled, (state: ProviderDetailsState): ProviderDetailsState => ({
    ...state,
    isApiKeyHidden: !state.isApiKeyHidden
  }))
)

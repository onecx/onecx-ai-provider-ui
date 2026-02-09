import { createReducer, on } from '@ngrx/store'
import { ProviderDetailsActions } from './provider-details.actions'
import { ProviderDetailsState } from './provider-details.state'

export const initialState: ProviderDetailsState = {
  details: undefined,
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
  on(
    ProviderDetailsActions.providerDetailsLoadingFailed,
    (state: ProviderDetailsState): ProviderDetailsState => ({
      ...state,
      details: undefined
    })
  ),
  on(
    ProviderDetailsActions.navigatedToDetailsPage,
    (): ProviderDetailsState => ({
      ...initialState
    })
  ),
  on(
    ProviderDetailsActions.providerDetailsEditModeSet,
    (state: ProviderDetailsState, {editMode}): ProviderDetailsState => ({
      ...state,
      editMode
    })
  ),
  on(
    ProviderDetailsActions.apiKeyVisibilityToggled,
    (state: ProviderDetailsState): ProviderDetailsState => ({
      ...state,
      isApiKeyHidden: !state.isApiKeyHidden
    })
  )
)

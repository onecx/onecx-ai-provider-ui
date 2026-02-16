import { createReducer, on } from '@ngrx/store'
import { MCPServerDetailsActions } from './mcpserver-details.actions'
import { MCPServerDetailsState } from './mcpserver-details.state'

export const initialState: MCPServerDetailsState = {
  details: undefined,
  detailsLoadingIndicator: true,
  detailsLoaded: false,
  editMode: false,
  isSubmitting: false,
  isApiKeyHidden: true
}

export const mcpserverDetailsReducer = createReducer(
  initialState,
  on(
    MCPServerDetailsActions.mCPServerDetailsReceived,
    (state: MCPServerDetailsState, { details }): MCPServerDetailsState => ({
      ...state,
      details,
      detailsLoadingIndicator: false,
      detailsLoaded: true
    })
  ),
  on(
    MCPServerDetailsActions.mCPServerDetailsLoadingFailed,
    (state: MCPServerDetailsState): MCPServerDetailsState => ({
      ...state,
      details: undefined,
      detailsLoadingIndicator: false,
      detailsLoaded: false
    })
  ),
  on(
    MCPServerDetailsActions.navigatedToDetailsPage,
    (): MCPServerDetailsState => ({
      ...initialState
    })
  ),
  on(
    MCPServerDetailsActions.editButtonClicked,
    (state: MCPServerDetailsState): MCPServerDetailsState => ({
      ...state,
      editMode: true
    })
  ),
  on(
    MCPServerDetailsActions.saveButtonClicked,
    (state: MCPServerDetailsState): MCPServerDetailsState => ({
      ...state,
      isSubmitting: true
    })
  ),
  on(
    MCPServerDetailsActions.cancelButtonClicked,
    (state: MCPServerDetailsState, { dirty }): MCPServerDetailsState => ({
      ...state,
      editMode: dirty ? state.editMode : false
    })
  ),
  on(
    MCPServerDetailsActions.cancelEditConfirmClicked,
    MCPServerDetailsActions.updateMCPServerCancelled,
    MCPServerDetailsActions.updateMCPServerSucceeded,
    (state: MCPServerDetailsState): MCPServerDetailsState => ({
      ...state,
      editMode: false
    })
  ),
  on(
    MCPServerDetailsActions.updateMCPServerFailed,
    (state: MCPServerDetailsState): MCPServerDetailsState => ({
      ...state,
      isSubmitting: false
    })
  ),
  on(
    MCPServerDetailsActions.apiKeyVisibilityToggled,
    (state: MCPServerDetailsState): MCPServerDetailsState => ({
      ...state,
      isApiKeyHidden: !state.isApiKeyHidden
    })
  )
)

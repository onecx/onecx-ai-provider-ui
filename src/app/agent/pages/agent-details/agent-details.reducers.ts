import { createReducer, on } from '@ngrx/store'
import { agentDetailsActions } from './agent-details.actions'
import { AgentDetailsState } from './agent-details.state'

export const initialState: AgentDetailsState = {
  details: undefined,
  detailsLoadingIndicator: true,
  detailsLoaded: false,
  editMode: false,
  isSubmitting: false
}

export const agentDetailsReducer = createReducer(
  initialState,
  on(
    agentDetailsActions.agentDetailsReceived,
    (state: AgentDetailsState, { details }): AgentDetailsState => ({
      ...state,
      details,
      detailsLoadingIndicator: false,
      detailsLoaded: true
    })
  ),
  on(
    agentDetailsActions.agentDetailsLoadingFailed,
    (state: AgentDetailsState): AgentDetailsState => ({
      ...state,
      details: undefined,
      detailsLoadingIndicator: false,
      detailsLoaded: false
    })
  ),
  on(
    agentDetailsActions.navigatedToDetailsPage,
    (): AgentDetailsState => ({
      ...initialState,
      detailsLoadingIndicator: true
    })
  ),
  on(
    agentDetailsActions.editButtonClicked,
    (state: AgentDetailsState): AgentDetailsState => ({
      ...state,
      editMode: true
    })
  ),
  on(
    agentDetailsActions.saveButtonClicked,
    (state: AgentDetailsState): AgentDetailsState => ({
      ...state,
      isSubmitting: true
    })
  ),
  on(
    agentDetailsActions.cancelEditConfirmClicked,
    agentDetailsActions.cancelEditNotDirty,
    agentDetailsActions.updateAgentCancelled,
    (state: AgentDetailsState): AgentDetailsState => ({
      ...state,
      editMode: false
    })
  ),
  on(
    agentDetailsActions.updateAgentSucceeded,
    (state: AgentDetailsState, { details }): AgentDetailsState => ({
      ...state,
      details,
      editMode: false,
      isSubmitting: false
    })
  ),
  on(
    agentDetailsActions.updateAgentFailed,
    (state: AgentDetailsState): AgentDetailsState => ({
      ...state,
      isSubmitting: false
    })
  )
)

import { createReducer, on } from '@ngrx/store'

import { agentDetailsActions } from './agent-details.actions'
import { AgentDetailsState } from './agent-details.state'

export const initialState: AgentDetailsState = {
  details: undefined,
  detailsLoadingIndicator: true,
  detailsLoaded: false,
  providers: [],
  providersLoadingIndicator: true,
  providersLoaded: false,
  models: [],
  modelsLoadingIndicator: true,
  modelsLoaded: false,
  scaffolds: [],
  scaffoldsLoadingIndicator: true,
  scaffoldsLoaded: false,
  tools: [],
  toolsLoadingIndicator: true,
  toolsLoaded: false,
  groups: [],
  groupsLoadingIndicator: true,
  groupsLoaded: false,
  editMode: false,
  isSubmitting: false
}

export const agentDetailsReducer = createReducer(
  initialState,
  on(agentDetailsActions.agentDetailsReceived, (state: AgentDetailsState, { details }): AgentDetailsState => ({
    ...state,
    details,
    detailsLoadingIndicator: false,
    detailsLoaded: true
  })),
  on(agentDetailsActions.agentDetailsLoadingFailed, (state: AgentDetailsState): AgentDetailsState => ({
    ...state,
    details: undefined,
    detailsLoadingIndicator: false,
    detailsLoaded: false
  })),
  on(agentDetailsActions.agentProvidersReceived, (state: AgentDetailsState, { providers }): AgentDetailsState => ({
    ...state,
    providers,
    providersLoadingIndicator: false,
    providersLoaded: true
  })),
  on(agentDetailsActions.agentProvidersLoadingFailed, (state: AgentDetailsState): AgentDetailsState => ({
    ...state,
    providers: [],
    providersLoadingIndicator: false,
    providersLoaded: false
  })),
  on(agentDetailsActions.agentModelsReceived, (state: AgentDetailsState, { models }): AgentDetailsState => ({
    ...state,
    models,
    modelsLoadingIndicator: false,
    modelsLoaded: true
  })),
  on(agentDetailsActions.agentModelsLoadingFailed, (state: AgentDetailsState): AgentDetailsState => ({
    ...state,
    models: [],
    modelsLoadingIndicator: false,
    modelsLoaded: false
  })),
  on(agentDetailsActions.agentScaffoldsReceived, (state: AgentDetailsState, { scaffolds }): AgentDetailsState => ({
    ...state,
    scaffolds,
    scaffoldsLoadingIndicator: false,
    scaffoldsLoaded: true
  })),
  on(agentDetailsActions.agentScaffoldsLoadingFailed, (state: AgentDetailsState): AgentDetailsState => ({
    ...state,
    scaffolds: [],
    scaffoldsLoadingIndicator: false,
    scaffoldsLoaded: false
  })),
  on(agentDetailsActions.agentToolsReceived, (state: AgentDetailsState, { tools }): AgentDetailsState => ({
    ...state,
    tools,
    toolsLoadingIndicator: false,
    toolsLoaded: true
  })),
  on(agentDetailsActions.agentToolsLoadingFailed, (state: AgentDetailsState): AgentDetailsState => ({
    ...state,
    tools: [],
    toolsLoadingIndicator: false,
    toolsLoaded: false
  })),
  on(agentDetailsActions.agentGroupsReceived, (state: AgentDetailsState, { groups }): AgentDetailsState => ({
    ...state,
    groups,
    groupsLoadingIndicator: false,
    groupsLoaded: true
  })),
  on(agentDetailsActions.agentGroupsLoadingFailed, (state: AgentDetailsState): AgentDetailsState => ({
    ...state,
    groups: [],
    groupsLoadingIndicator: false,
    groupsLoaded: false
  })),
  on(agentDetailsActions.createGroupInPlaceSucceeded, (state: AgentDetailsState, { group }): AgentDetailsState => ({
    ...state,
    groups: state.groups.some((existingGroup) => existingGroup.id === group.id)
      ? state.groups
      : [...state.groups, group]
  })),
  on(agentDetailsActions.navigatedToDetailsPage, (): AgentDetailsState => ({
    ...initialState,
    detailsLoadingIndicator: true
  })),
  on(agentDetailsActions.editButtonClicked, (state: AgentDetailsState): AgentDetailsState => ({
    ...state,
    editMode: true
  })),
  on(agentDetailsActions.saveButtonClicked, (state: AgentDetailsState): AgentDetailsState => ({
    ...state,
    isSubmitting: true
  })),
  on(
    agentDetailsActions.cancelEditConfirmClicked,
    agentDetailsActions.cancelEditNotDirty,
    agentDetailsActions.updateAgentCancelled,
    (state: AgentDetailsState): AgentDetailsState => ({
      ...state,
      editMode: false
    })
  ),
  on(agentDetailsActions.updateAgentSucceeded, (state: AgentDetailsState, { details }): AgentDetailsState => ({
    ...state,
    details,
    editMode: false,
    isSubmitting: false
  })),
  on(agentDetailsActions.updateAgentFailed, (state: AgentDetailsState): AgentDetailsState => ({
    ...state,
    isSubmitting: false
  }))
)

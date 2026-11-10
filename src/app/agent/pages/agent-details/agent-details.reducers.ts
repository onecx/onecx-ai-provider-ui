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
  configurationVersions: [],
  configurationVersionsLoadingIndicator: false,
  activatingConfigurationVersionId: undefined,
  configurationVersionDetails: {},
  loadingVersionDetailIds: [],
  editMode: false,
  isSubmitting: false,
  isPublishingConfigurationVersion: false
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
    detailsLoadingIndicator: true,
    configurationVersionsLoadingIndicator: true
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
      editMode: false,
      isSubmitting: false
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
  })),
  on(agentDetailsActions.publishConfigurationVersionSubmitted, (state: AgentDetailsState): AgentDetailsState => ({
    ...state,
    isPublishingConfigurationVersion: true
  })),
  on(agentDetailsActions.publishConfigurationVersionSucceeded, (state, { version }): AgentDetailsState => ({
    ...state,
    isPublishingConfigurationVersion: false,
    configurationVersions: [
      ...state.configurationVersions.map((v) => (version.active ? { ...v, active: false } : v)),
      version
    ]
  })),
  on(agentDetailsActions.publishConfigurationVersionFailed, (state: AgentDetailsState): AgentDetailsState => ({
    ...state,
    isPublishingConfigurationVersion: false
  })),
  on(agentDetailsActions.configurationVersionsReceived, (state, { versions }): AgentDetailsState => ({
    ...state,
    configurationVersions: versions,
    configurationVersionsLoadingIndicator: false
  })),
  on(agentDetailsActions.configurationVersionsLoadingFailed, (state): AgentDetailsState => ({
    ...state,
    configurationVersions: [],
    configurationVersionsLoadingIndicator: false
  })),
  on(agentDetailsActions.activateConfigurationVersionClicked, (state, { versionId }): AgentDetailsState => ({
    ...state,
    activatingConfigurationVersionId: versionId
  })),
  on(agentDetailsActions.activateConfigurationVersionSucceeded, (state, { version }): AgentDetailsState => ({
    ...state,
    activatingConfigurationVersionId: undefined,
    configurationVersions: state.configurationVersions.map((v) => ({
      ...v,
      active: v.id === version.id
    }))
  })),
  on(agentDetailsActions.activateConfigurationVersionFailed, (state): AgentDetailsState => ({
    ...state,
    activatingConfigurationVersionId: undefined
  })),
  on(agentDetailsActions.configurationVersionDetailRequested, (state, { versionId }): AgentDetailsState => {
    // Cached details are never fetched again, so marking them as loading would leave the spinner forever.
    if (state.configurationVersionDetails[versionId] || state.loadingVersionDetailIds.includes(versionId)) {
      return state
    }
    return { ...state, loadingVersionDetailIds: [...state.loadingVersionDetailIds, versionId] }
  }),
  on(
    agentDetailsActions.configurationVersionDetailReceived,
    (state, { versionId, configuration }): AgentDetailsState => ({
      ...state,
      configurationVersionDetails: { ...state.configurationVersionDetails, [versionId]: configuration },
      loadingVersionDetailIds: state.loadingVersionDetailIds.filter((id) => id !== versionId)
    })
  ),
  on(agentDetailsActions.configurationVersionDetailLoadingFailed, (state, { versionId }): AgentDetailsState => ({
    ...state,
    loadingVersionDetailIds: state.loadingVersionDetailIds.filter((id) => id !== versionId)
  }))
)

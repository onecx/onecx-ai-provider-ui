import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { agentFeature } from '../../agent.reducers'
import { initialState } from './agent-details.reducers'
import { AgentDetailsViewModel } from './agent-details.viewmodel'

import { Agent } from 'src/app/shared/generated'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'

export const agentDetailsSelectors = createChildSelectors(agentFeature.selectDetails, initialState)

export const selectProvidersState = createSelector(
  agentDetailsSelectors.selectProviders,
  agentDetailsSelectors.selectProvidersLoadingIndicator,
  agentDetailsSelectors.selectProvidersLoaded,
  (providers, providersLoadingIndicator, providersLoaded) => ({
    providers,
    providersLoadingIndicator,
    providersLoaded
  })
)

export const selectModelsState = createSelector(
  agentDetailsSelectors.selectModels,
  agentDetailsSelectors.selectModelsLoadingIndicator,
  agentDetailsSelectors.selectModelsLoaded,
  (models, modelsLoadingIndicator, modelsLoaded) => ({
    models,
    modelsLoadingIndicator,
    modelsLoaded
  })
)

export const selectScaffoldsState = createSelector(
  agentDetailsSelectors.selectScaffolds,
  agentDetailsSelectors.selectScaffoldsLoadingIndicator,
  agentDetailsSelectors.selectScaffoldsLoaded,
  (scaffolds, scaffoldsLoadingIndicator, scaffoldsLoaded) => ({
    scaffolds,
    scaffoldsLoadingIndicator,
    scaffoldsLoaded
  })
)

export const selectToolsState = createSelector(
  agentDetailsSelectors.selectTools,
  agentDetailsSelectors.selectToolsLoadingIndicator,
  agentDetailsSelectors.selectToolsLoaded,
  (tools, toolsLoadingIndicator, toolsLoaded) => ({
    tools,
    toolsLoadingIndicator,
    toolsLoaded
  })
)

export const selectGroupsState = createSelector(
  agentDetailsSelectors.selectGroups,
  agentDetailsSelectors.selectGroupsLoadingIndicator,
  agentDetailsSelectors.selectGroupsLoaded,
  (groups, groupsLoadingIndicator, groupsLoaded) => ({
    groups,
    groupsLoadingIndicator,
    groupsLoaded
  })
)

export const selectAgentDetailsViewModel = createSelector(
  agentDetailsSelectors.selectDetails,
  agentDetailsSelectors.selectDetailsLoadingIndicator,
  selectProvidersState,
  selectModelsState,
  selectScaffoldsState,
  selectToolsState,
  selectGroupsState,
  selectBackNavigationPossible,
  agentDetailsSelectors.selectDetailsLoaded,
  agentDetailsSelectors.selectEditMode,
  agentDetailsSelectors.selectIsSubmitting,
  (
    details: Agent | undefined,
    detailsLoadingIndicator: boolean,
    providersState,
    modelsState,
    scaffoldsState,
    toolsState,
    groupsState,
    backNavigationPossible: boolean,
    detailsLoaded: boolean,
    editMode: boolean,
    isSubmitting: boolean
  ): AgentDetailsViewModel => ({
    details,
    detailsLoadingIndicator,
    ...providersState,
    ...modelsState,
    ...scaffoldsState,
    ...toolsState,
    ...groupsState,
    backNavigationPossible,
    detailsLoaded,
    editMode,
    isSubmitting
  })
)

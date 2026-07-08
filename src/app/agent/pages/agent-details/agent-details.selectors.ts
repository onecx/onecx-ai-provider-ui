import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { agentFeature } from '../../agent.reducers'
import { initialState } from './agent-details.reducers'
import { AgentDetailsViewModel } from './agent-details.viewmodel'

import { Agent } from 'src/app/shared/generated'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'

export const agentDetailsSelectors = createChildSelectors(agentFeature.selectDetails, initialState)

export const selectAgentDetailsViewModel = createSelector(
  agentDetailsSelectors.selectDetails,
  agentDetailsSelectors.selectDetailsLoadingIndicator,
  selectBackNavigationPossible,
  agentDetailsSelectors.selectDetailsLoaded,
  agentDetailsSelectors.selectEditMode,
  agentDetailsSelectors.selectIsSubmitting,
  (
    details: Agent | undefined,
    detailsLoadingIndicator: boolean,
    backNavigationPossible: boolean,
    detailsLoaded: boolean,
    editMode: boolean,
    isSubmitting: boolean
  ): AgentDetailsViewModel => ({
    details,
    detailsLoadingIndicator,
    backNavigationPossible,
    detailsLoaded,
    editMode,
    isSubmitting
  })
)

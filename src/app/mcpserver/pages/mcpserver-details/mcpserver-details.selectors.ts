import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'
import { MCPServer } from '../../../shared/generated'
import { mcpserverFeature } from '../../mcpserver.reducers'
import { initialState } from './mcpserver-details.reducers'
import { MCPServerDetailsViewModel } from './mcpserver-details.viewmodel'

export const mcpserverDetailsSelectors = createChildSelectors(mcpserverFeature.selectDetails, initialState)

export const selectMCPServerDetailsViewModel = createSelector(
  mcpserverDetailsSelectors.selectDetails,
  mcpserverDetailsSelectors.selectDetailsLoadingIndicator,
  selectBackNavigationPossible,
  mcpserverDetailsSelectors.selectDetailsLoaded,
  mcpserverDetailsSelectors.selectEditMode,
  mcpserverDetailsSelectors.selectIsSubmitting,
  mcpserverDetailsSelectors.selectIsApiKeyHidden,
  (
    details: MCPServer | undefined,
    detailsLoadingIndicator: boolean,
    backNavigationPossible: boolean,
    detailsLoaded: boolean,
    editMode: boolean,
    isSubmitting: boolean,
    isApiKeyHidden: boolean
  ): MCPServerDetailsViewModel => ({
    details,
    detailsLoadingIndicator,
    backNavigationPossible,
    detailsLoaded,
    editMode,
    isSubmitting,
    isApiKeyHidden
  })
)

import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { RowListGridData } from '@onecx/angular-accelerator'

import { initialState } from './mcpserver-search.reducers'
import { MCPServerSearchViewModel } from './mcpserver-search.viewmodel'
import { mcpserverFeature } from '../../mcpserver.reducers'

export const mcpserverSearchSelectors = createChildSelectors(mcpserverFeature.selectSearch, initialState)

export const selectResults = createSelector(mcpserverSearchSelectors.selectResults, (results): RowListGridData[] => {
  return results.map((item) => ({
    imagePath: '',
    id: item.id ?? '',
    ...item
    // ACTION S6: Add additional fields as needed
    // https://onecx.github.io/docs/nx-plugins/current/general/getting_started/search/configure-search-results.html#action-6
    // ACTION S7: Create a mapping of the items and their corresponding translation keys
    // https://onecx.github.io/docs/nx-plugins/current/general/getting_started/search/configure-search-results.html#action-7
  }))
})

const selectSearchCoreState = createSelector(
  mcpserverSearchSelectors.selectColumns,
  mcpserverSearchSelectors.selectCriteria,
  selectResults,
  (columns, searchCriteria, results) => ({
    columns,
    searchCriteria,
    results
  })
)

const selectComponentStates = createSelector(
  mcpserverSearchSelectors.selectResultComponentState,
  mcpserverSearchSelectors.selectSearchHeaderComponentState,
  mcpserverSearchSelectors.selectDiagramComponentState,
  (resultComponentState, searchHeaderComponentState, diagramComponentState) => ({
    resultComponentState,
    searchHeaderComponentState,
    diagramComponentState
  })
)

const selectUiState = createSelector(
  mcpserverSearchSelectors.selectChartVisible,
  mcpserverSearchSelectors.selectSearchLoadingIndicator,
  mcpserverSearchSelectors.selectSearchExecuted,
  (chartVisible, searchLoadingIndicator, searchExecuted) => ({
    chartVisible,
    searchLoadingIndicator,
    searchExecuted
  })
)

export const selectMCPServerSearchViewModel = createSelector(
  selectSearchCoreState,
  selectComponentStates,
  selectUiState,
  (coreState, componentStates, uiState): MCPServerSearchViewModel => ({
    ...coreState,
    ...componentStates,
    ...uiState
  })
)

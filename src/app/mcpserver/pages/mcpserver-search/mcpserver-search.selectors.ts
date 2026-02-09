import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { RowListGridData } from '@onecx/portal-integration-angular'
import { mcpserverFeature } from '../../mcpserver.reducers'
import { initialState } from './mcpserver-search.reducers'
import { MCPServerSearchViewModel } from './mcpserver-search.viewmodel'

export const mcpserverSearchSelectors = createChildSelectors(mcpserverFeature.selectSearch, initialState)

export const selectResults = createSelector(mcpserverSearchSelectors.selectResults, (results): RowListGridData[] => {
  return results.map((item) => ({
    imagePath: '',
    id: item.id ?? '',
    ...item,
    // ACTION S6: Add additional fields as needed
    // https://onecx.github.io/docs/nx-plugins/current/general/getting_started/search/configure-search-results.html#action-6
    // ACTION S7: Create a mapping of the items and their corresponding translation keys
    // https://onecx.github.io/docs/nx-plugins/current/general/getting_started/search/configure-search-results.html#action-7
  }))
})

export const selectMCPServerSearchViewModel = createSelector(
  mcpserverSearchSelectors.selectColumns,
  mcpserverSearchSelectors.selectCriteria,
  selectResults,
  mcpserverSearchSelectors.selectResultComponentState,
  mcpserverSearchSelectors.selectSearchHeaderComponentState,
  mcpserverSearchSelectors.selectDiagramComponentState,
  mcpserverSearchSelectors.selectChartVisible,
  mcpserverSearchSelectors.selectSearchLoadingIndicator,
  mcpserverSearchSelectors.selectSearchExecuted,
  (
    columns,
    searchCriteria,
    results,
    resultComponentState,
    searchHeaderComponentState,
    diagramComponentState,
    chartVisible,
    searchLoadingIndicator,
    searchExecuted
  ): MCPServerSearchViewModel => ({
    columns,
    searchCriteria,
    results,
    resultComponentState,
    searchHeaderComponentState,
    diagramComponentState,
    chartVisible,
    searchLoadingIndicator,
    searchExecuted
  })
)

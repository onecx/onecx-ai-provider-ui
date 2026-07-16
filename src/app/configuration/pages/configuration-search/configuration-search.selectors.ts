import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { DataTableColumn, RowListGridData } from '@onecx/angular-accelerator'
import { configurationFeature } from '../../configuration.reducers'
import { initialState } from './configuration-search.reducers'
import { ConfigurationSearchViewModel } from './configuration-search.viewmodel'

export const configurationSearchSelectors = createChildSelectors(configurationFeature.selectSearch, initialState)

export const selectResults = createSelector(
  configurationSearchSelectors.selectResults,
  (results): RowListGridData[] => {
    return results.map((item) => ({
      imagePath: '',
      ...item,
      id: item.id || ''
    }))
  }
)

export const selectDisplayedColumns = createSelector(
  configurationSearchSelectors.selectColumns,
  configurationSearchSelectors.selectDisplayedColumns,
  (columns, displayedColumns): DataTableColumn[] => {
    return (displayedColumns?.map((d) => columns.find((c) => c.id === d)).filter(Boolean) as DataTableColumn[]) ?? []
  }
)

export const selectSearchCoreState = createSelector(
  configurationSearchSelectors.selectColumns,
  configurationSearchSelectors.selectCriteria,
  selectResults,
  selectDisplayedColumns,
  (columns, searchCriteria, results, displayedColumns) => ({
    columns,
    searchCriteria,
    results,
    displayedColumns
  })
)

export const selectComponentStates = createSelector(
  configurationSearchSelectors.selectResultComponentState,
  configurationSearchSelectors.selectSearchHeaderComponentState,
  configurationSearchSelectors.selectDiagramComponentState,
  (resultComponentState, searchHeaderComponentState, diagramComponentState) => ({
    resultComponentState,
    searchHeaderComponentState,
    diagramComponentState
  })
)

export const selectUiState = createSelector(
  configurationSearchSelectors.selectChartVisible,
  configurationSearchSelectors.selectSearchLoadingIndicator,
  configurationSearchSelectors.selectSearchExecuted,
  (chartVisible, searchLoadingIndicator, searchExecuted) => ({
    chartVisible,
    searchLoadingIndicator,
    searchExecuted
  })
)

export const selectConfigurationSearchViewModel = createSelector(
  selectSearchCoreState,
  selectComponentStates,
  selectUiState,
  (coreState, componentStates, uiState): ConfigurationSearchViewModel => ({
    ...coreState,
    ...componentStates,
    ...uiState
  })
)

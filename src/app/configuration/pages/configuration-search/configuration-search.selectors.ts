import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { DataTableColumn, RowListGridData } from '@onecx/portal-integration-angular'
import { configurationFeature } from '../../configuration.reducers'
import { initialState } from './configuration-search.reducers'
import { ConfigurationSearchViewModel } from './configuration-search.viewmodel'

export const configurationSearchSelectors = createChildSelectors(configurationFeature.selectSearch, initialState)

export const selectResults = createSelector(configurationSearchSelectors.selectResults, (results): RowListGridData[] => {
  return results.map((item) => ({
    imagePath: '',
    ...item,
    id: item.id || ''
  }))
})

export const selectDisplayedColumns = createSelector(
  configurationSearchSelectors.selectColumns,
  configurationSearchSelectors.selectDisplayedColumns,
  (columns, displayedColumns): DataTableColumn[] => {
    return (displayedColumns?.map((d) => columns.find((c) => c.id === d)).filter((d) => d) as DataTableColumn[]) ?? []
  }
)

export const selectConfigurationSearchViewModel = createSelector(
  configurationSearchSelectors.selectColumns,
  configurationSearchSelectors.selectCriteria,
  selectResults,
  selectDisplayedColumns,
  configurationSearchSelectors.selectResultComponentState,
  configurationSearchSelectors.selectSearchHeaderComponentState,
  configurationSearchSelectors.selectDiagramComponentState,
  configurationSearchSelectors.selectChartVisible,
  configurationSearchSelectors.selectSearchLoadingIndicator,
  configurationSearchSelectors.selectSearchExecuted,
  (
    columns,
    searchCriteria,
    results,
    displayedColumns,
    resultComponentState,
    searchHeaderComponentState,
    diagramComponentState,
    chartVisible,
    searchLoadingIndicator,
    searchExecuted
  ): ConfigurationSearchViewModel => ({
    columns,
    searchCriteria,
    results,
    displayedColumns,
    resultComponentState,
    searchHeaderComponentState,
    diagramComponentState,
    chartVisible,
    searchLoadingIndicator,
    searchExecuted
  })
)

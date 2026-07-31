import { createSelector } from '@ngrx/store'

import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { DataTableColumn, RowListGridData } from '@onecx/angular-accelerator'

import { initialState } from './provider-search.reducers'
import { ProviderSearchViewModel } from './provider-search.viewmodel'
import { ProviderFeature } from '../../provider.reducers'

export const ProviderSearchSelectors = createChildSelectors(ProviderFeature.selectSearch, initialState)

export const selectResults = createSelector(ProviderSearchSelectors.selectResults, (results): RowListGridData[] => {
  return results.map((item) => {
    return {
      imagePath: '',
      id: item.id ?? '',
      name: item.name,
      type: item.type,
      description: item.description,
      llmUrl: item.llmUrl,
      authMode: item.authMode,
      creationDate: item.creationDate,
      modificationDate: item.modificationDate
    }
  })
})

export const selectDisplayedColumns = createSelector(
  ProviderSearchSelectors.selectColumns,
  ProviderSearchSelectors.selectDisplayedColumns,
  (columns, displayedColumns): DataTableColumn[] => {
    return (displayedColumns?.map((d) => columns.find((c) => c.id === d)).filter(Boolean) as DataTableColumn[]) ?? []
  }
)

export const selectProviderSearchViewModel = createSelector(
  ProviderSearchSelectors.selectColumns,
  ProviderSearchSelectors.selectCriteria,
  selectResults,
  selectDisplayedColumns,
  ProviderSearchSelectors.selectViewMode,
  ProviderSearchSelectors.selectChartVisible,
  (columns, searchCriteria, results, displayedColumns, viewMode, chartVisible): ProviderSearchViewModel => ({
    columns,
    searchCriteria,
    results,
    displayedColumns,
    viewMode,
    chartVisible
  })
)

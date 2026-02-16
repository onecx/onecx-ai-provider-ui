import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { DataTableColumn, RowListGridData } from '@onecx/portal-integration-angular'
import { ProviderFeature } from '../../provider.reducers'
import { initialState } from './provider-search.reducers'
import { ProviderSearchViewModel } from './provider-search.viewmodel'

export const ProviderSearchSelectors = createChildSelectors(ProviderFeature.selectSearch, initialState)

export const selectResults = createSelector(ProviderSearchSelectors.selectResults, (results): RowListGridData[] => {
  return results.map((item) => ({
    imagePath: '',
    id: item.id ?? '',
    name: item.name,
    description: item.description,
    llmUrl: item.llmUrl,
    modelName: item.modelName,
  }))
})

export const selectDisplayedColumns = createSelector(
  ProviderSearchSelectors.selectColumns,
  ProviderSearchSelectors.selectDisplayedColumns,
  (columns, displayedColumns): DataTableColumn[] => {
    return (displayedColumns?.map((d) => columns.find((c) => c.id === d)).filter((d) => d) as DataTableColumn[]) ?? []
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

import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { DataTableColumn, RowListGridData } from '@onecx/angular-accelerator'
import { ProviderFeature } from '../../provider.reducers'
import { initialState } from './provider-search.reducers'
import { ProviderSearchViewModel } from './provider-search.viewmodel'

export const ProviderSearchSelectors = createChildSelectors(ProviderFeature.selectSearch, initialState)

export const selectResults = createSelector(
  ProviderSearchSelectors.selectResults,
  ProviderSearchSelectors.selectHealthStatus,
  (results, healthStatus): RowListGridData[] => {
    return results.map((item) => {
      const raw = healthStatus ? healthStatus[item.id ?? ''] : undefined
      const statusKey = (raw ?? 'NODATA').toString().toUpperCase()

      return {
        imagePath: '',
        id: item.id ?? '',
        name: item.name,
        description: item.description,
        llmUrl: item.llmUrl,
        status: statusKey
      }
    })
  }
)

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

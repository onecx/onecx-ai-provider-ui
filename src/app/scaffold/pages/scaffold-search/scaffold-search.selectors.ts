import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { DataTableColumn, RowListGridData } from '@onecx/angular-accelerator'
import { scaffoldFeature } from '../../scaffold.reducers'
import { initialState } from './scaffold-search.reducers'
import { ScaffoldSearchViewModel } from './scaffold-search.viewmodel'

export const scaffoldSearchSelectors = createChildSelectors(scaffoldFeature.selectSearch, initialState)

export const selectResults = createSelector(
  scaffoldSearchSelectors.selectResults,
  (results): RowListGridData[] =>
    results.map((item) => ({
      imagePath: '',
      id: item.id ?? '',
      name: item.name,
      sourceProduct: item.sourceProduct
    }))
)

export const selectDisplayedColumns = createSelector(
  scaffoldSearchSelectors.selectColumns,
  scaffoldSearchSelectors.selectDisplayedColumns,
  (columns, displayedColumns): DataTableColumn[] => {
    return (displayedColumns?.map((d) => columns.find((c) => c.id === d)).filter(Boolean) as DataTableColumn[]) ?? []
  }
)

export const selectScaffoldSearchViewModel = createSelector(
  scaffoldSearchSelectors.selectColumns,
  scaffoldSearchSelectors.selectCriteria,
  selectResults,
  selectDisplayedColumns,
  scaffoldSearchSelectors.selectViewMode,
  scaffoldSearchSelectors.selectChartVisible,
  (
    columns,
    searchCriteria,
    results,
    displayedColumns,
    viewMode,
    chartVisible
  ): ScaffoldSearchViewModel => ({
    columns,
    searchCriteria,
    results,
    displayedColumns,
    viewMode,
    chartVisible
  })
)

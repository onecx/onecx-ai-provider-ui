import { createSelector } from '@ngrx/store'

import { RowListGridData } from '@onecx/angular-accelerator'
import { createChildSelectors } from '@onecx/ngrx-accelerator'

import { Scaffold } from 'src/app/shared/generated'
import { scaffoldFeature } from '../../scaffold.reducers'
import { initialState } from './scaffold-search.reducers'
import { ScaffoldSearchViewModel } from './scaffold-search.viewmodel'

export const scaffoldSearchSelectors = createChildSelectors(scaffoldFeature.selectSearch, initialState)

export const selectResults = createSelector(
  scaffoldSearchSelectors.selectResults,
  (results: Scaffold[]): RowListGridData[] => {
    return results.map((item) => ({
      imagePath: '',
      id: item.id ?? '',
      ...item
      // ACTION S7: Create a mapping of the items and their corresponding translation keys
    }))
  }
)

export const selectScaffoldSearchViewModel = createSelector(
  scaffoldSearchSelectors.selectColumns,
  scaffoldSearchSelectors.selectCriteria,
  selectResults,
  scaffoldSearchSelectors.selectResultComponentState,
  scaffoldSearchSelectors.selectSearchHeaderComponentState,
  scaffoldSearchSelectors.selectDiagramComponentState,
  scaffoldSearchSelectors.selectChartVisible,
  scaffoldSearchSelectors.selectSearchLoadingIndicator,
  scaffoldSearchSelectors.selectSearchExecuted,
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
  ): ScaffoldSearchViewModel => ({
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

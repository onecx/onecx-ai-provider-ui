import { createSelector } from '@ngrx/store'

import { RowListGridData } from '@onecx/angular-accelerator'
import { createChildSelectors } from '@onecx/ngrx-accelerator'

import { Scaffold } from 'src/app/shared/generated'
import { initialState } from './scaffold-search.reducers'
import { ScaffoldSearchViewModel } from './scaffold-search.viewmodel'
import { scaffoldFeature } from '../../scaffold.reducers'

export const scaffoldSearchSelectors = createChildSelectors(scaffoldFeature.selectSearch, initialState)

export const selectResults = createSelector(
  scaffoldSearchSelectors.selectResults,
  (results: Scaffold[]): RowListGridData[] => {
    return results
      .filter((item): item is Scaffold & { id: string } => !!item.id)
      .map((item) => ({
        imagePath: '',
        ...item,
        id: item.id
      }))
  }
)

export const selectSearchState = createSelector(
  scaffoldSearchSelectors.selectCriteria,
  scaffoldSearchSelectors.selectSearchLoadingIndicator,
  scaffoldSearchSelectors.selectSearchExecuted,
  (searchCriteria, searchLoadingIndicator, searchExecuted) => ({
    searchCriteria,
    searchLoadingIndicator,
    searchExecuted
  })
)

export const selectComponentState = createSelector(
  scaffoldSearchSelectors.selectResultComponentState,
  scaffoldSearchSelectors.selectSearchHeaderComponentState,
  scaffoldSearchSelectors.selectDiagramComponentState,
  scaffoldSearchSelectors.selectChartVisible,
  (resultComponentState, searchHeaderComponentState, diagramComponentState, chartVisible) => ({
    resultComponentState,
    searchHeaderComponentState,
    diagramComponentState,
    chartVisible
  })
)

export const selectScaffoldSearchViewModel = createSelector(
  scaffoldSearchSelectors.selectColumns,
  selectResults,
  selectSearchState,
  selectComponentState,
  (columns, results, searchState, componentState): ScaffoldSearchViewModel => ({
    columns,
    results,
    ...searchState,
    ...componentState
  })
)

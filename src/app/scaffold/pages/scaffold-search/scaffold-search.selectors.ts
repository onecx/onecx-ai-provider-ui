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
    return results
      .filter((item): item is Scaffold & { id: string } => !!item.id)
      .map((item) => ({
        imagePath: '',
        ...item,
        id: item.id
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

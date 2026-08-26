import { createSelector } from '@ngrx/store'

import { RowListGridData } from '@onecx/angular-accelerator'
import { createChildSelectors } from '@onecx/ngrx-accelerator'

import { Skill } from 'src/app/shared/generated'
import { initialState } from './skill-search.reducers'
import { SkillSearchViewModel } from './skill-search.viewmodel'
import { skillFeature } from '../../skill.reducers'

export const skillSearchSelectors = createChildSelectors(skillFeature.selectSearch, initialState)

export const selectResults = createSelector(
  skillSearchSelectors.selectResults,
  (results: Skill[]): RowListGridData[] => {
    return results
      .filter((item): item is Skill & { id: string } => !!item.id)
      .map((item) => ({
        imagePath: '',
        ...item,
        id: item.id
      }))
  }
)

export const selectSearchState = createSelector(
  skillSearchSelectors.selectCriteria,
  skillSearchSelectors.selectSearchLoadingIndicator,
  skillSearchSelectors.selectSearchExecuted,
  (searchCriteria, searchLoadingIndicator, searchExecuted) => ({
    searchCriteria,
    searchLoadingIndicator,
    searchExecuted
  })
)

export const selectComponentState = createSelector(
  skillSearchSelectors.selectResultComponentState,
  skillSearchSelectors.selectSearchHeaderComponentState,
  skillSearchSelectors.selectDiagramComponentState,
  skillSearchSelectors.selectChartVisible,
  (resultComponentState, searchHeaderComponentState, diagramComponentState, chartVisible) => ({
    resultComponentState,
    searchHeaderComponentState,
    diagramComponentState,
    chartVisible
  })
)

export const selectSkillSearchViewModel = createSelector(
  skillSearchSelectors.selectColumns,
  selectResults,
  selectSearchState,
  selectComponentState,
  (columns, results, searchState, componentState): SkillSearchViewModel => ({
    columns,
    results,
    ...searchState,
    ...componentState
  })
)

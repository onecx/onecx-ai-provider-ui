import { createSelector } from '@ngrx/store'

import { RowListGridData } from '@onecx/angular-accelerator'
import { createChildSelectors } from '@onecx/ngrx-accelerator'

import { Skill } from 'src/app/shared/generated'
import { skillFeature } from '../../skill.reducers'
import { initialState } from './skill-search.reducers'
import { SkillSearchViewModel } from './skill-search.viewmodel'

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

export const selectSkillSearchViewModel = createSelector(
  skillSearchSelectors.selectColumns,
  skillSearchSelectors.selectCriteria,
  selectResults,
  skillSearchSelectors.selectResultComponentState,
  skillSearchSelectors.selectSearchHeaderComponentState,
  skillSearchSelectors.selectDiagramComponentState,
  skillSearchSelectors.selectChartVisible,
  skillSearchSelectors.selectSearchLoadingIndicator,
  skillSearchSelectors.selectSearchExecuted,
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
  ): SkillSearchViewModel => ({
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

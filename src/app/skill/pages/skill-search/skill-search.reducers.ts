import { createReducer, on } from '@ngrx/store'

import { routerNavigatedAction, RouterNavigatedAction } from '@ngrx/router-store'
import { skillSearchActions } from './skill-search.actions'
import { skillSearchColumns } from './skill-search.columns'
import { skillSearchCriteriasSchema } from './skill-search.parameters'
import { SkillSearchState } from './skill-search.state'

export const initialState: SkillSearchState = {
  columns: skillSearchColumns,
  results: [],
  chartVisible: false,
  resultComponentState: null,
  searchHeaderComponentState: null,
  diagramComponentState: null,
  searchLoadingIndicator: false,
  criteria: {},
  searchExecuted: false
}

export const skillSearchReducer = createReducer(
  initialState,
  on(routerNavigatedAction, (state: SkillSearchState, action: RouterNavigatedAction) => {
    const results = skillSearchCriteriasSchema.safeParse(action.payload.routerState.root.queryParams)
    if (results.success) {
      return {
        ...state,
        criteria: results.data,
        searchLoadingIndicator: Object.keys(action.payload.routerState.root.queryParams).length != 0
      }
    }
    return state
  }),
  on(
    skillSearchActions.resetButtonClicked,
    (state: SkillSearchState): SkillSearchState => ({
      ...state,
      results: initialState.results,
      criteria: {},
      searchExecuted: false
    })
  ),
  on(
    skillSearchActions.searchButtonClicked,
    (state: SkillSearchState, { searchCriteria }): SkillSearchState => ({
      ...state,
      searchLoadingIndicator: true,
      criteria: searchCriteria
    })
  ),
  on(
    skillSearchActions.skillSearchResultsReceived,
    (state: SkillSearchState, { stream }): SkillSearchState => ({
      ...state,
      results: stream,
      searchLoadingIndicator: false,
      searchExecuted: true
    })
  ),
  on(
    skillSearchActions.skillSearchResultsLoadingFailed,
    (state: SkillSearchState): SkillSearchState => ({
      ...state,
      results: [],
      searchLoadingIndicator: false
    })
  ),
  on(
    skillSearchActions.chartVisibilityToggled,
    (state: SkillSearchState): SkillSearchState => ({
      ...state,
      chartVisible: !state.chartVisible
    })
  ),
  on(
    skillSearchActions.resultComponentStateChanged,
    (state: SkillSearchState, resultComponentState): SkillSearchState => ({
      ...state,
      resultComponentState
    })
  ),
  on(
    skillSearchActions.searchHeaderComponentStateChanged,
    (state: SkillSearchState, searchHeaderComponentState): SkillSearchState => ({
      ...state,
      searchHeaderComponentState
    })
  ),
  on(
    skillSearchActions.diagramComponentStateChanged,
    (state: SkillSearchState, diagramComponentState): SkillSearchState => ({
      ...state,
      diagramComponentState
    })
  )
)

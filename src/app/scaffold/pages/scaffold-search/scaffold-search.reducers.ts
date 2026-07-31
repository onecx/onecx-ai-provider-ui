import { createReducer, on } from '@ngrx/store'
import { routerNavigatedAction, RouterNavigatedAction } from '@ngrx/router-store'

import { scaffoldSearchActions } from './scaffold-search.actions'
import { scaffoldSearchColumns } from './scaffold-search.columns'
import { scaffoldSearchCriteriasSchema } from './scaffold-search.parameters'
import { ScaffoldSearchState } from './scaffold-search.state'

export const initialState: ScaffoldSearchState = {
  columns: scaffoldSearchColumns,
  results: [],
  chartVisible: false,
  resultComponentState: null,
  searchHeaderComponentState: null,
  diagramComponentState: null,
  searchLoadingIndicator: false,
  criteria: {},
  searchExecuted: false,
  skills: []
}

export const scaffoldSearchReducer = createReducer(
  initialState,
  on(routerNavigatedAction, (state: ScaffoldSearchState, action: RouterNavigatedAction) => {
    const results = scaffoldSearchCriteriasSchema.safeParse(action.payload.routerState.root.queryParams)
    if (results.success) {
      return {
        ...state,
        criteria: results.data,
        searchLoadingIndicator: Object.keys(action.payload.routerState.root.queryParams).length != 0
      }
    }
    return state
  }),
  on(scaffoldSearchActions.resetButtonClicked, (state: ScaffoldSearchState): ScaffoldSearchState => ({
    ...state,
    results: initialState.results,
    criteria: {},
    searchExecuted: false
  })),
  on(
    scaffoldSearchActions.searchButtonClicked,
    (state: ScaffoldSearchState, { searchCriteria }): ScaffoldSearchState => ({
      ...state,
      searchLoadingIndicator: true,
      criteria: searchCriteria
    })
  ),
  on(
    scaffoldSearchActions.scaffoldSearchResultsReceived,
    (state: ScaffoldSearchState, { stream }): ScaffoldSearchState => ({
      ...state,
      results: stream,
      searchLoadingIndicator: false,
      searchExecuted: true
    })
  ),
  on(scaffoldSearchActions.scaffoldSearchResultsLoadingFailed, (state: ScaffoldSearchState): ScaffoldSearchState => ({
    ...state,
    results: [],
    searchLoadingIndicator: false
  })),
  on(scaffoldSearchActions.chartVisibilityToggled, (state: ScaffoldSearchState): ScaffoldSearchState => ({
    ...state,
    chartVisible: !state.chartVisible
  })),
  on(
    scaffoldSearchActions.resultComponentStateChanged,
    (state: ScaffoldSearchState, resultComponentState): ScaffoldSearchState => ({
      ...state,
      resultComponentState
    })
  ),
  on(
    scaffoldSearchActions.searchHeaderComponentStateChanged,
    (state: ScaffoldSearchState, searchHeaderComponentState): ScaffoldSearchState => ({
      ...state,
      searchHeaderComponentState
    })
  ),
  on(
    scaffoldSearchActions.diagramComponentStateChanged,
    (state: ScaffoldSearchState, diagramComponentState): ScaffoldSearchState => ({
      ...state,
      diagramComponentState
    })
  ),
  on(scaffoldSearchActions.scaffoldSkillsReceived, (state: ScaffoldSearchState, { skills }): ScaffoldSearchState => ({
    ...state,
    skills
  })),
  on(scaffoldSearchActions.scaffoldSkillsLoadingFailed, (state: ScaffoldSearchState): ScaffoldSearchState => ({
    ...state,
    skills: []
  }))
)

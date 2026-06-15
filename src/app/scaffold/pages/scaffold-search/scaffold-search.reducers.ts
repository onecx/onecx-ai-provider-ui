import { routerNavigatedAction, RouterNavigatedAction } from '@ngrx/router-store'
import { createReducer, on } from '@ngrx/store'
import { ScaffoldSearchActions } from './scaffold-search.actions'
import { scaffoldSearchColumns } from './scaffold-search.columns'
import { scaffoldSearchCriteriasSchema } from './scaffold-search.parameters'
import { ScaffoldSearchState } from './scaffold-search.state'

export const initialState: ScaffoldSearchState = {
  columns: scaffoldSearchColumns,
  results: [],
  displayedColumns: null,
  viewMode: 'basic',
  chartVisible: false,
  searchLoadingIndicator: false,
  criteria: {},
}

export const scaffoldSearchReducer = createReducer(
  initialState,
  on(routerNavigatedAction, (state: ScaffoldSearchState, action: RouterNavigatedAction) => {
    const results = scaffoldSearchCriteriasSchema.safeParse(action.payload.routerState.root.queryParams)
    if (results.success) {
      return {
        ...state,
        criteria: results.data,
        searchLoadingIndicator: true
      }
    }
    return state
  }),
  on(ScaffoldSearchActions.resetButtonClicked, (state): ScaffoldSearchState => ({
    ...state,
    results: initialState.results,
    criteria: {},
    searchLoadingIndicator: false
  })),
  on(ScaffoldSearchActions.searchButtonClicked, (state, { searchCriteria }): ScaffoldSearchState => ({
    ...state,
    searchLoadingIndicator: true,
    criteria: searchCriteria
  })),
  on(ScaffoldSearchActions.scaffoldSearchResultsReceived, (state, { results }): ScaffoldSearchState => ({
    ...state,
    results,
    searchLoadingIndicator: false
  })),
  on(ScaffoldSearchActions.scaffoldSearchResultsLoadingFailed, (state): ScaffoldSearchState => ({
    ...state,
    results: [],
    searchLoadingIndicator: false
  })),
  on(ScaffoldSearchActions.chartVisibilityRehydrated, (state: ScaffoldSearchState, { visible }): ScaffoldSearchState => ({
    ...state,
    chartVisible: visible
  })),
  on(ScaffoldSearchActions.chartVisibilityToggled, (state): ScaffoldSearchState => ({
    ...state,
    chartVisible: !state.chartVisible
  })),
  on(ScaffoldSearchActions.viewModeChanged, (state, { viewMode }): ScaffoldSearchState => ({
    ...state,
    viewMode
  })),
  on(ScaffoldSearchActions.displayedColumnsChanged, (state, { displayedColumns }): ScaffoldSearchState => ({
    ...state,
    displayedColumns: displayedColumns.map((v) => v.id)
  }))
)

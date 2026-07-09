import { routerNavigatedAction, RouterNavigatedAction } from '@ngrx/router-store'
import { createReducer, on } from '@ngrx/store'
import { ProviderSearchActions } from './provider-search.actions'
import { ProviderSearchColumns } from './provider-search.columns'
import { ProviderSearchCriteriasSchema } from './provider-search.parameters'
import { ProviderSearchState } from './provider-search.state'

export const initialState: ProviderSearchState = {
  columns: ProviderSearchColumns,
  results: [],
  displayedColumns: null,
  viewMode: 'basic',
  chartVisible: false,
  searchLoadingIndicator: false,
  criteria: {}
}

export const ProviderSearchReducer = createReducer(
  initialState,
  on(routerNavigatedAction, (state: ProviderSearchState, action: RouterNavigatedAction) => {
    const results = ProviderSearchCriteriasSchema.safeParse(action.payload.routerState.root.queryParams)
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
    ProviderSearchActions.resetButtonClicked,
    (state: ProviderSearchState): ProviderSearchState => ({
      ...state,
      results: initialState.results,
      criteria: {}
    })
  ),
  on(
    ProviderSearchActions.searchButtonClicked,
    (state: ProviderSearchState, { searchCriteria }): ProviderSearchState => ({
      ...state,
      searchLoadingIndicator: true,
      criteria: searchCriteria
    })
  ),
  on(
    ProviderSearchActions.providerSearchResultsReceived,
    (state: ProviderSearchState, { results }): ProviderSearchState => ({
      ...state,
      results
    })
  ),
  on(
    ProviderSearchActions.providerSearchResultsLoadingFailed,
    (state: ProviderSearchState): ProviderSearchState => ({
      ...state,
      results: []
    })
  ),
  on(
    ProviderSearchActions.chartVisibilityRehydrated,
    (state: ProviderSearchState, { visible }): ProviderSearchState => ({
      ...state,
      chartVisible: visible
    })
  ),
  on(
    ProviderSearchActions.chartVisibilityToggled,
    (state: ProviderSearchState): ProviderSearchState => ({
      ...state,
      chartVisible: !state.chartVisible
    })
  ),
  on(
    ProviderSearchActions.viewModeChanged,
    (state: ProviderSearchState, { viewMode }): ProviderSearchState => ({
      ...state,
      viewMode: viewMode
    })
  ),
  on(
    ProviderSearchActions.displayedColumnsChanged,
    (state: ProviderSearchState, { displayedColumns }): ProviderSearchState => ({
      ...state,
      displayedColumns: displayedColumns.map((v) => v.id)
    })
  )
)

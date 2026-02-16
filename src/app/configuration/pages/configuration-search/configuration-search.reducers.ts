import { routerNavigatedAction, RouterNavigatedAction } from '@ngrx/router-store'
import { createReducer, on } from '@ngrx/store'
import { ConfigurationSearchActions } from './configuration-search.actions'
import { configurationSearchColumns } from './configuration-search.columns'
import { configurationSearchCriteriasSchema } from './configuration-search.parameters'
import { ConfigurationSearchState } from './configuration-search.state'

export const initialState: ConfigurationSearchState = {
  columns: configurationSearchColumns,
  results: [],
  displayedColumns: null,
  chartVisible: false,
  viewMode: 'basic',
  resultComponentState: null,
  searchHeaderComponentState: null,
  diagramComponentState: null,
  searchLoadingIndicator: false,
  criteria: {},
  searchExecuted: false
}

export const configurationSearchReducer = createReducer(
  initialState,
  on(routerNavigatedAction, (state: ConfigurationSearchState, action: RouterNavigatedAction) => {
    const results = configurationSearchCriteriasSchema.safeParse(action.payload.routerState.root.queryParams)
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
    ConfigurationSearchActions.resetButtonClicked,
    (state: ConfigurationSearchState): ConfigurationSearchState => ({
      ...state,
      results: initialState.results,
      criteria: {},
      searchExecuted: false
    })
  ),
  on(
    ConfigurationSearchActions.searchButtonClicked,
    (state: ConfigurationSearchState, { searchCriteria }): ConfigurationSearchState => ({
      ...state,
      searchLoadingIndicator: true,
      criteria: searchCriteria
    })
  ),
  on(
    ConfigurationSearchActions.configurationSearchResultsReceived,
    (state: ConfigurationSearchState, { stream }): ConfigurationSearchState => ({
      ...state,
      results: stream,
      searchLoadingIndicator: false,
      searchExecuted: true
    })
  ),
  on(
    ConfigurationSearchActions.configurationSearchResultsLoadingFailed,
    (state: ConfigurationSearchState): ConfigurationSearchState => ({
      ...state,
      results: [],
      searchLoadingIndicator: false
    })
  ),
  on(
    ConfigurationSearchActions.chartVisibilityToggled,
    (state: ConfigurationSearchState): ConfigurationSearchState => ({
      ...state,
      chartVisible: !state.chartVisible
    })
  ),
  on(
    ConfigurationSearchActions.resultComponentStateChanged,
    (state: ConfigurationSearchState, resultComponentState): ConfigurationSearchState => ({
      ...state,
      resultComponentState
    })
  ),
  on(
    ConfigurationSearchActions.searchHeaderComponentStateChanged,
    (state: ConfigurationSearchState, searchHeaderComponentState): ConfigurationSearchState => ({
      ...state,
      searchHeaderComponentState
    })
  ),
  on(
    ConfigurationSearchActions.diagramComponentStateChanged,
    (state: ConfigurationSearchState, diagramComponentState): ConfigurationSearchState => ({
      ...state,
      diagramComponentState
    })
  ),
  on(
    ConfigurationSearchActions.viewModeChanged,
    (state: ConfigurationSearchState, { viewMode }): ConfigurationSearchState => ({
      ...state,
      viewMode: viewMode
    })
  ),
  on(
    ConfigurationSearchActions.displayedColumnsChanged,
    (state: ConfigurationSearchState, { displayedColumns }): ConfigurationSearchState => ({
      ...state,
      displayedColumns: displayedColumns.map((v) => v.id)
    })
  )
)

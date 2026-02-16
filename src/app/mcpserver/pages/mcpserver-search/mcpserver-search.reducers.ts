import { routerNavigatedAction, RouterNavigatedAction } from '@ngrx/router-store'
import { createReducer, on } from '@ngrx/store'
import { MCPServerSearchActions } from './mcpserver-search.actions'
import { mcpserverSearchColumns } from './mcpserver-search.columns'
import { mcpserverSearchCriteriasSchema } from './mcpserver-search.parameters'
import { MCPServerSearchState } from './mcpserver-search.state'

export const initialState: MCPServerSearchState = {
  columns: mcpserverSearchColumns,
  results: [],
  chartVisible: false,
  resultComponentState: null,
  searchHeaderComponentState: null,
  diagramComponentState: null,
  searchLoadingIndicator: false,
  criteria: {},
  searchExecuted: false
}

export const mcpserverSearchReducer = createReducer(
  initialState,
  on(routerNavigatedAction, (state: MCPServerSearchState, action: RouterNavigatedAction) => {
    const results = mcpserverSearchCriteriasSchema.safeParse(action.payload.routerState.root.queryParams)
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
    MCPServerSearchActions.resetButtonClicked,
    (state: MCPServerSearchState): MCPServerSearchState => ({
      ...state,
      results: initialState.results,
      criteria: {},
      searchExecuted: false
    })
  ),
  on(
    MCPServerSearchActions.searchButtonClicked,
    (state: MCPServerSearchState, { searchCriteria }): MCPServerSearchState => ({
      ...state,
      criteria: searchCriteria
    })
  ),
  on(
    MCPServerSearchActions.mcpserverSearchResultsReceived,
    (state: MCPServerSearchState, { stream }): MCPServerSearchState => ({
      ...state,
      results: stream,
      searchLoadingIndicator: false,
      searchExecuted: true
    })
  ),
  on(
    MCPServerSearchActions.mcpserverSearchResultsLoadingFailed,
    (state: MCPServerSearchState): MCPServerSearchState => ({
      ...state,
      results: [],
      searchLoadingIndicator: false
    })
  ),
  on(
    MCPServerSearchActions.chartVisibilityToggled,
    (state: MCPServerSearchState): MCPServerSearchState => ({
      ...state,
      chartVisible: !state.chartVisible
    })
  ),
  on(
    MCPServerSearchActions.resultComponentStateChanged,
    (state: MCPServerSearchState, resultComponentState): MCPServerSearchState => ({
      ...state,
      resultComponentState
    })
  ),
  on(
    MCPServerSearchActions.searchHeaderComponentStateChanged,
    (state: MCPServerSearchState, searchHeaderComponentState): MCPServerSearchState => ({
      ...state,
      searchHeaderComponentState
    })
  ),
  on(
    MCPServerSearchActions.diagramComponentStateChanged,
    (state: MCPServerSearchState, diagramComponentState): MCPServerSearchState => ({
      ...state,
      diagramComponentState
    })
  )
)

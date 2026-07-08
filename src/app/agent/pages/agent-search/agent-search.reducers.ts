import { createReducer, on } from '@ngrx/store'

import { routerNavigatedAction, RouterNavigatedAction } from '@ngrx/router-store'
import { agentSearchActions } from './agent-search.actions'
import { agentSearchColumns } from './agent-search.columns'
import { agentSearchCriteriasSchema } from './agent-search.parameters'
import { AgentSearchState } from './agent-search.state'

export const initialState: AgentSearchState = {
  columns: agentSearchColumns,
  results: [],
  chartVisible: false,
  resultComponentState: null,
  searchHeaderComponentState: null,
  diagramComponentState: null,
  searchLoadingIndicator: false,
  criteria: {},
  searchExecuted: false
}

export const agentSearchReducer = createReducer(
  initialState,
  on(routerNavigatedAction, (state: AgentSearchState, action: RouterNavigatedAction) => {
    const results = agentSearchCriteriasSchema.safeParse(action.payload.routerState.root.queryParams)
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
    agentSearchActions.resetButtonClicked,
    (state: AgentSearchState): AgentSearchState => ({
      ...state,
      results: initialState.results,
      criteria: {},
      searchExecuted: false
    })
  ),
  on(
    agentSearchActions.searchButtonClicked,
    (state: AgentSearchState, { searchCriteria }): AgentSearchState => ({
      ...state,
      searchLoadingIndicator: true,
      criteria: searchCriteria
    })
  ),
  on(
    agentSearchActions.agentSearchResultsReceived,
    (state: AgentSearchState, { stream }): AgentSearchState => ({
      ...state,
      results: stream,
      searchLoadingIndicator: false,
      searchExecuted: true
    })
  ),
  on(
    agentSearchActions.agentSearchResultsLoadingFailed,
    (state: AgentSearchState): AgentSearchState => ({
      ...state,
      results: [],
      searchLoadingIndicator: false
    })
  ),
  on(
    agentSearchActions.chartVisibilityToggled,
    (state: AgentSearchState): AgentSearchState => ({
      ...state,
      chartVisible: !state.chartVisible
    })
  ),
  on(
    agentSearchActions.resultComponentStateChanged,
    (state: AgentSearchState, resultComponentState): AgentSearchState => ({
      ...state,
      resultComponentState
    })
  ),
  on(
    agentSearchActions.searchHeaderComponentStateChanged,
    (state: AgentSearchState, searchHeaderComponentState): AgentSearchState => ({
      ...state,
      searchHeaderComponentState
    })
  ),
  on(
    agentSearchActions.diagramComponentStateChanged,
    (state: AgentSearchState, diagramComponentState): AgentSearchState => ({
      ...state,
      diagramComponentState
    })
  )
)

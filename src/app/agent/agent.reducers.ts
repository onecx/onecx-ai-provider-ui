import { combineReducers, createFeature } from '@ngrx/store'

import { agentDetailsReducer } from './pages/agent-details/agent-details.reducers'
import { agentSearchReducer } from './pages/agent-search/agent-search.reducers'

import { AgentState } from './agent.state'

export const agentFeature = createFeature({
  name: 'agent',
  reducer: combineReducers<AgentState>({
    details: agentDetailsReducer,
    search: agentSearchReducer
  })
})

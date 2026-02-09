import { combineReducers, createFeature } from '@ngrx/store'
import { MCPServerState } from './mcpserver.state'
import { mcpserverDetailsReducer } from './pages/mcpserver-details/mcpserver-details.reducers'
import { mcpserverSearchReducer } from './pages/mcpserver-search/mcpserver-search.reducers'

export const mcpserverFeature = createFeature({
  name: 'mcpserver',
  reducer: combineReducers<MCPServerState>({
    details: mcpserverDetailsReducer,
    search: mcpserverSearchReducer
  })
})

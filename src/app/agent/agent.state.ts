import { AgentDetailsState } from './pages/agent-details/agent-details.state'
import { AgentSearchState } from './pages/agent-search/agent-search.state'

export interface AgentState {
  details: AgentDetailsState
  search: AgentSearchState
}

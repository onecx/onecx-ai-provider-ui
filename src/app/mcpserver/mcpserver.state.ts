import { MCPServerDetailsState } from './pages/mcpserver-details/mcpserver-details.state'
import { MCPServerSearchState } from './pages/mcpserver-search/mcpserver-search.state'
export interface MCPServerState {
  details: MCPServerDetailsState

  search: MCPServerSearchState
}

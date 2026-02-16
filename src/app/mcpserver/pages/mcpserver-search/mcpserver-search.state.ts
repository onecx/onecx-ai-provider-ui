import {
  DataTableColumn,
  DiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/portal-integration-angular'
import { MCPServer } from 'src/app/shared/generated'
import { MCPServerSearchCriteria } from './mcpserver-search.parameters'

export interface MCPServerSearchState {
  columns: DataTableColumn[]
  results: MCPServer[]
  chartVisible: boolean
  resultComponentState: InteractiveDataViewComponentState | null
  searchHeaderComponentState: SearchHeaderComponentState | null
  diagramComponentState: DiagramComponentState | null
  searchLoadingIndicator: boolean
  criteria: MCPServerSearchCriteria
  searchExecuted: boolean
}

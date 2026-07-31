import {
  DataTableColumn,
  DiagramComponentState,
  InteractiveDataViewComponentState,
  RowListGridData,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'

import { MCPServerSearchCriteria } from './mcpserver-search.parameters'

export interface MCPServerSearchViewModel {
  columns: DataTableColumn[]
  searchCriteria: MCPServerSearchCriteria
  results: RowListGridData[]
  resultComponentState: InteractiveDataViewComponentState | null
  searchHeaderComponentState: SearchHeaderComponentState | null
  diagramComponentState: DiagramComponentState | null
  chartVisible: boolean
  searchLoadingIndicator: boolean
  searchExecuted: boolean
}

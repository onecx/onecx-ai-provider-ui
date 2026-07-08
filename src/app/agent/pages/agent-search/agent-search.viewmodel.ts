import {
  DataTableColumn,
  DiagramComponentState,
  InteractiveDataViewComponentState,
  RowListGridData,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'
import { AgentSearchCriteria } from './agent-search.parameters'

export interface AgentSearchViewModel {
  columns: DataTableColumn[]
  searchCriteria: AgentSearchCriteria
  results: RowListGridData[]
  resultComponentState: InteractiveDataViewComponentState | null
  searchHeaderComponentState: SearchHeaderComponentState | null
  diagramComponentState: DiagramComponentState | null
  chartVisible: boolean
  searchLoadingIndicator: boolean
  searchExecuted: boolean
}

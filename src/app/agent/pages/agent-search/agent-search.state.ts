import {
  DataTableColumn,
  DiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'
import { Agent } from 'src/app/shared/generated'
import { AgentSearchCriteria } from './agent-search.parameters'

export interface AgentSearchState {
  columns: DataTableColumn[]
  results: Agent[]
  chartVisible: boolean
  resultComponentState: InteractiveDataViewComponentState | null
  searchHeaderComponentState: SearchHeaderComponentState | null
  diagramComponentState: DiagramComponentState | null
  searchLoadingIndicator: boolean
  criteria: AgentSearchCriteria
  searchExecuted: boolean
}

import {
  DataTableColumn,
  DiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'
import { Scaffold, Skill } from 'src/app/shared/generated'
import { ScaffoldSearchCriteria } from './scaffold-search.parameters'

export interface ScaffoldSearchState {
  columns: DataTableColumn[]
  results: Scaffold[]
  chartVisible: boolean
  resultComponentState: InteractiveDataViewComponentState | null
  searchHeaderComponentState: SearchHeaderComponentState | null
  diagramComponentState: DiagramComponentState | null
  searchLoadingIndicator: boolean
  criteria: ScaffoldSearchCriteria
  searchExecuted: boolean
  skills: Skill[]
}

import {
  DataTableColumn,
  DiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'
import { Skill } from 'src/app/shared/generated'
import { SkillSearchCriteria } from './skill-search.parameters'

export interface SkillSearchState {
  columns: DataTableColumn[]
  results: Skill[]
  chartVisible: boolean
  resultComponentState: InteractiveDataViewComponentState | null
  searchHeaderComponentState: SearchHeaderComponentState | null
  diagramComponentState: DiagramComponentState | null
  searchLoadingIndicator: boolean
  criteria: SkillSearchCriteria
  searchExecuted: boolean
}

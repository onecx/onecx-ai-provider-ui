import { createActionGroup, emptyProps, props } from '@ngrx/store'
import {
  GroupByCountDiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'
import { Agent } from '../../../shared/generated'
import { AgentSearchCriteria } from './agent-search.parameters'

export const agentSearchActions = createActionGroup({
  source: 'AgentSearch',
  events: {
    'Create agent button clicked': emptyProps(),
    'Edit agent button clicked': props<{ id: number | string }>(),
    'Create agent cancelled': emptyProps(),
    'Update agent cancelled': emptyProps(),
    'Create agent succeeded': emptyProps(),
    'Update agent succeeded': emptyProps(),
    'Create agent failed': props<{ error: string | null }>(),
    'Update agent failed': props<{ error: string | null }>(),
    'Details button clicked': props<{ id: number | string }>(),
    'Search button clicked': props<{
      searchCriteria: AgentSearchCriteria
    }>(),
    'Reset button clicked': emptyProps(),
    'Agent search results received': props<{
      stream: Agent[]
      size: number
      number: number
      totalElements: number
      totalPages: number
    }>(),
    'Agent search results loading failed': props<{ error: string | null }>(),
    'Export button clicked': emptyProps(),
    'Result component state changed': props<InteractiveDataViewComponentState>(),
    'Search header component state changed': props<SearchHeaderComponentState>(),
    'Diagram component state changed': props<GroupByCountDiagramComponentState>(),
    'Chart visibility toggled': emptyProps()
  }
})

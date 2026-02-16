import { createActionGroup, emptyProps, props } from '@ngrx/store'
import {
  GroupByCountDiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/portal-integration-angular'
import { MCPServer } from '../../../shared/generated'
import { MCPServerSearchCriteria } from './mcpserver-search.parameters'

export const MCPServerSearchActions = createActionGroup({
  source: 'MCPServerSearch',
  events: {
    'Details button clicked': props<{
      id: number | string
    }>(),

    'Search button clicked': props<{
      searchCriteria: MCPServerSearchCriteria
    }>(),
    'Reset button clicked': emptyProps(),
    'mcpserver search results received': props<{
      stream: MCPServer[]
      size: number
      number: number
      totalElements: number
      totalPages: number
    }>(),
    'mcpserver search results loading failed': props<{ error: string | null }>(),
    'Export button clicked': emptyProps(),
    'Result component state changed': props<InteractiveDataViewComponentState>(),
    'Search header component state changed': props<SearchHeaderComponentState>(),
    'Diagram component state changed': props<GroupByCountDiagramComponentState>(),
    'Chart visibility toggled': emptyProps()
  }
})

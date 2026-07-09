import { createActionGroup, emptyProps, props } from '@ngrx/store'
import {
  GroupByCountDiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'
import { Tool as MCPServer } from 'src/app/shared/generated'
import { MCPServerSearchCriteria } from './mcpserver-search.parameters'

export const MCPServerSearchActions = createActionGroup({
  source: 'MCPServerSearch',
  events: {
    'Create mcpserver button clicked': emptyProps(),
    'Edit mcpserver button clicked': props<{
      id: number | string
    }>(),
    'Create mcpserver cancelled': emptyProps(),
    'Update mcpserver cancelled': emptyProps(),
    'Create mcpserver succeeded': emptyProps(),
    'Update mcpserver succeeded': emptyProps(),
    'Create mcpserver failed': props<{
      error: string | null
    }>(),
    'Update mcpserver failed': props<{
      error: string | null
    }>(),

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

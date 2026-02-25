import { createActionGroup, emptyProps, props } from '@ngrx/store'
import {
  DataTableColumn,
  GroupByCountDiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/portal-integration-angular'
import { Configuration } from '../../../shared/generated'
import { ConfigurationSearchCriteria } from './configuration-search.parameters'

export const ConfigurationSearchActions = createActionGroup({
  source: 'ConfigurationSearch',
  events: {
    'Details button clicked': props<{
      id: number | string
    }>(),

    'Delete configuration button clicked': props<{
      id: number | string
    }>(),
    'Delete configuration cancelled': emptyProps(),
    'Delete configuration succeeded': emptyProps(),
    'Delete configuration failed': props<{
      error: string | null
    }>(),

    'Create configuration button clicked': emptyProps(),
    'Edit configuration button clicked': props<{
      id: number | string
    }>(),
    'Create configuration cancelled': emptyProps(),
    'Update configuration cancelled': emptyProps(),
    'Create configuration succeeded': emptyProps(),
    'Update configuration succeeded': emptyProps(),
    'Create configuration failed': props<{
      error: string | null
    }>(),
    'Update configuration failed': props<{
      error: string | null
    }>(),
    'Search button clicked': props<{
      searchCriteria: ConfigurationSearchCriteria
    }>(),
    'Reset button clicked': emptyProps(),
    'configuration search results received': props<{
      stream: Configuration[]
      size: number
      number: number
      totalElements: number
      totalPages: number
    }>(),
    'configuration search results loading failed': props<{ error: string | null }>(),
    'Export button clicked': emptyProps(),
    'Result component state changed': props<InteractiveDataViewComponentState>(),
    'Search header component state changed': props<SearchHeaderComponentState>(),
    'Diagram component state changed': props<GroupByCountDiagramComponentState>(),
    'Chart visibility toggled': emptyProps(),
    'View mode changed': props<{
      viewMode: 'basic' | 'advanced'
    }>(),
    'Displayed columns changed': props<{
      displayedColumns: DataTableColumn[]
    }>(),
    'Navigate to providers button clicked': emptyProps(),
    'Navigate to MCP servers button clicked': emptyProps()
  }
})

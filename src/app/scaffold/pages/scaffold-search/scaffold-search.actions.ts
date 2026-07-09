import { createActionGroup, emptyProps, props } from '@ngrx/store'
import {
  GroupByCountDiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'
import { Scaffold } from '../../../shared/generated'
import { ScaffoldSearchCriteria } from './scaffold-search.parameters'

export const scaffoldSearchActions = createActionGroup({
  source: 'ScaffoldSearch',
  events: {
    'Details button clicked': props<{ id: number | string }>(),
    'Search button clicked': props<{
      searchCriteria: ScaffoldSearchCriteria
    }>(),
    'Reset button clicked': emptyProps(),
    'Scaffold search results received': props<{
      stream: Scaffold[]
      size: number
      number: number
      totalElements: number
      totalPages: number
    }>(),
    'Scaffold search results loading failed': props<{ error: string | null }>(),
    'Export button clicked': emptyProps(),
    'Result component state changed': props<InteractiveDataViewComponentState>(),
    'Search header component state changed': props<SearchHeaderComponentState>(),
    'Diagram component state changed': props<GroupByCountDiagramComponentState>(),
    'Chart visibility toggled': emptyProps()
  }
})

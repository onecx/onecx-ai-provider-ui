import { createActionGroup, emptyProps, props } from '@ngrx/store'

import {
  GroupByCountDiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'

import { Scaffold, Skill } from 'src/app/shared/generated'
import { ScaffoldSearchCriteria } from './scaffold-search.parameters'

export const scaffoldSearchActions = createActionGroup({
  source: 'ScaffoldSearch',
  events: {
    'Create scaffold button clicked': emptyProps(),
    'Edit scaffold button clicked': props<{
      id: number | string
    }>(),
    'Create scaffold cancelled': emptyProps(),
    'Update scaffold cancelled': emptyProps(),
    'Create scaffold succeeded': emptyProps(),
    'Update scaffold succeeded': emptyProps(),
    'Create scaffold failed': props<{
      error: string | null
    }>(),
    'Update scaffold failed': props<{
      error: string | null
    }>(),

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
    'Chart visibility toggled': emptyProps(),
    'Load skills': emptyProps(),
    'Scaffold skills received': props<{ skills: Skill[] }>(),
    'Scaffold skills loading failed': props<{ error: string | null }>()
  }
})

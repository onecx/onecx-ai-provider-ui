import { createActionGroup, emptyProps, props } from '@ngrx/store'

import {
  GroupByCountDiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'

import { Skill } from 'src/app/shared/generated'
import { SkillSearchCriteria } from './skill-search.parameters'

export const skillSearchActions = createActionGroup({
  source: 'SkillSearch',
  events: {
    'Create skill button clicked': emptyProps(),
    'Edit skill button clicked': props<{
      id: number | string
    }>(),
    'Create skill cancelled': emptyProps(),
    'Update skill cancelled': emptyProps(),
    'Create skill succeeded': emptyProps(),
    'Update skill succeeded': emptyProps(),
    'Create skill failed': props<{
      error: string | null
    }>(),
    'Update skill failed': props<{
      error: string | null
    }>(),

    'Details button clicked': props<{ id: number | string }>(),
    'Search button clicked': props<{
      searchCriteria: SkillSearchCriteria
    }>(),
    'Reset button clicked': emptyProps(),
    'Skill search results received': props<{
      stream: Skill[]
      size: number
      number: number
      totalElements: number
      totalPages: number
    }>(),
    'Skill search results loading failed': props<{ error: string | null }>(),
    'Export button clicked': emptyProps(),
    'Result component state changed': props<InteractiveDataViewComponentState>(),
    'Search header component state changed': props<SearchHeaderComponentState>(),
    'Diagram component state changed': props<GroupByCountDiagramComponentState>(),
    'Chart visibility toggled': emptyProps()
  }
})

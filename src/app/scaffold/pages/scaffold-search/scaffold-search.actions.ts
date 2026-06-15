import { createActionGroup, emptyProps, props } from '@ngrx/store'
import { DataTableColumn } from '@onecx/angular-accelerator'
import { Scaffold } from 'src/app/shared/generated'
import { ScaffoldSearchCriteria } from './scaffold-search.parameters'

export const ScaffoldSearchActions = createActionGroup({
  source: 'ScaffoldSearch',
  events: {
    'Details button clicked': props<{ id: number | string }>(),
    'Delete scaffold button clicked': props<{ id: number | string }>(),
    'Delete scaffold cancelled': emptyProps(),
    'Delete scaffold succeeded': emptyProps(),
    'Delete scaffold failed': props<{ error: string | null }>(),
    'Create scaffold button clicked': emptyProps(),
    'Edit scaffold button clicked': props<{ id: number | string }>(),
    'Create scaffold cancelled': emptyProps(),
    'Update scaffold cancelled': emptyProps(),
    'Create scaffold succeeded': emptyProps(),
    'Update scaffold succeeded': emptyProps(),
    'Create scaffold failed': props<{ error: string | null }>(),
    'Update scaffold failed': props<{ error: string | null }>(),
    'Search button clicked': props<{ searchCriteria: ScaffoldSearchCriteria }>(),
    'Reset button clicked': emptyProps(),
    'Scaffold search results received': props<{
      results: Scaffold[]
      totalNumberOfResults: number 
    }>(),
    'Scaffold search results loading failed': props<{ error: string | null }>(),
    'Displayed columns changed': props<{ displayedColumns: DataTableColumn[] }>(),
    'Chart visibility rehydrated': props<{
      visible: boolean
    }>(),
    'Chart visibility toggled': emptyProps(),
    'View mode changed': props<{ viewMode: 'basic' | 'advanced' }>(),
    'Export button clicked': emptyProps()
  }
})

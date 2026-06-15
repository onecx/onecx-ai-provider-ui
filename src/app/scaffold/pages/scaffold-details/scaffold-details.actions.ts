import { createActionGroup, emptyProps, props } from '@ngrx/store'
import { Scaffold } from 'src/app/shared/generated'

export const ScaffoldDetailsActions = createActionGroup({
  source: 'ScaffoldDetails',
  events: {
    'Navigated to details page': props<{ id: string | undefined }>(),
    'Scaffold details received': props<{ details: Scaffold }>(),
    'Scaffold details loading failed': props<{ error: string | null }>(),
    'Scaffold details edit mode set': props<{ editMode: boolean }>(),
    'Navigate back button clicked': emptyProps(),
    'Cancel button clicked': props<{ dirty: boolean }>(),
    'Cancel edit back clicked': emptyProps(),
    'Cancel edit confirm clicked': emptyProps(),
    'Save button clicked': props<{ details: Scaffold }>(),
    'Update scaffold succeeded': emptyProps(),
    'Update scaffold failed': props<{ error: string | null }>(),
    'Update scaffold cancelled': emptyProps(),
    'Delete button clicked': emptyProps(),
    'Delete scaffold succeeded': emptyProps(),
    'Delete scaffold failed': props<{ error: string | null }>(),
    'Delete scaffold cancelled': emptyProps(),
    'Edit scaffold button clicked': props<{ id: number | string }>(),
    'Delete scaffold button clicked': props<{ id: number | string }>(),
  }
})

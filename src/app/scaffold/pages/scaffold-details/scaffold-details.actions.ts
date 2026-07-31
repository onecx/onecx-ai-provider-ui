import { createActionGroup, emptyProps, props } from '@ngrx/store'

import { Scaffold, Skill, Tool } from 'src/app/shared/generated'

export const scaffoldDetailsActions = createActionGroup({
  source: 'ScaffoldDetails',
  events: {
    'Navigated to details page': props<{ id: string | undefined }>(),
    'Scaffold details received': props<{ details: Scaffold | undefined }>(),
    'Scaffold details loading failed': props<{ error: string | null }>(),
    'Scaffold details loading failed missing id': props<{ error: string | null }>(),
    'Scaffold skills received': props<{ skills: Skill[] }>(),
    'Scaffold skills loading failed': props<{ error: string | null }>(),
    'Scaffold tools received': props<{ tools: Tool[] }>(),
    'Scaffold tools loading failed': props<{ error: string | null }>(),
    'Edit mode set': props<{ editMode: boolean }>(),
    'Update Scaffold cancelled': emptyProps(),
    'Update Scaffold succeeded': props<{ details: Scaffold | undefined }>(),
    'Update Scaffold failed': props<{ error: string | null }>(),
    'Delete Scaffold cancelled': emptyProps(),
    'Delete Scaffold succeeded': emptyProps(),
    'Delete Scaffold failed': props<{ error: string | null }>(),
    'Cancel edit back clicked': emptyProps(),
    'Cancel edit confirm clicked': emptyProps(),
    'Cancel edit not dirty': emptyProps(),
    'Edit button clicked': emptyProps(),
    'Save button clicked': props<{ details: Scaffold }>(),
    'Cancel button clicked': props<{ dirty: boolean }>(),
    'Delete button clicked': emptyProps(),
    'Navigate back button clicked': emptyProps(),
    'Back navigation started': emptyProps(),
    'Back navigation failed': emptyProps(),
    'Navigation to search started': emptyProps(),
    'Navigation to search not started': emptyProps()
  }
})

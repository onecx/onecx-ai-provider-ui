import { createActionGroup, emptyProps, props } from '@ngrx/store'

import { Skill } from 'src/app/shared/generated'

export const skillDetailsActions = createActionGroup({
  source: 'SkillDetails',
  events: {
    'Navigated to details page': props<{ id: string | undefined }>(),
    'Skill details received': props<{ details: Skill | undefined }>(),
    'Skill details loading failed': props<{ error: string | null }>(),
    'Skill details loading failed missing id': props<{ error: string | null }>(),
    'Edit mode set': props<{ editMode: boolean }>(),
    'Update Skill cancelled': emptyProps(),
    'Update Skill succeeded': props<{ details: Skill | undefined }>(),
    'Update Skill failed': props<{ error: string | null }>(),
    'Delete Skill cancelled': emptyProps(),
    'Delete Skill succeeded': emptyProps(),
    'Delete Skill failed': props<{ error: string | null }>(),
    'Cancel edit back clicked': emptyProps(),
    'Cancel edit confirm clicked': emptyProps(),
    'Cancel edit not dirty': emptyProps(),
    'Edit button clicked': emptyProps(),
    'Save button clicked': props<{ details: Skill }>(),
    'Cancel button clicked': props<{ dirty: boolean }>(),
    'Delete button clicked': emptyProps(),
    'Navigate back button clicked': emptyProps(),
    'Back navigation started': emptyProps(),
    'Back navigation failed': emptyProps(),
    'Navigation to search started': emptyProps(),
    'Navigation to search not started': emptyProps()
  }
})

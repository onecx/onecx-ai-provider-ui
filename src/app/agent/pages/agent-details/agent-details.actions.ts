import { createActionGroup, emptyProps, props } from '@ngrx/store'
import { Agent } from 'src/app/shared/generated'

export const agentDetailsActions = createActionGroup({
  source: 'AgentDetails',
  events: {
    'Navigated to details page': props<{ id: string | undefined }>(),
    'Agent details received': props<{ details: Agent | undefined }>(),
    'Agent details loading failed': props<{ error: string | null }>(),
    'Agent details loading failed missing id': props<{ error: string | null }>(),
    'Edit mode set': props<{ editMode: boolean }>(),
    'Update Agent cancelled': emptyProps(),
    'Update Agent succeeded': props<{ details: Agent | undefined }>(),
    'Update Agent failed': props<{ error: string | null }>(),
    'Delete Agent cancelled': emptyProps(),
    'Delete Agent succeeded': emptyProps(),
    'Delete Agent failed': props<{ error: string | null }>(),
    'Cancel edit back clicked': emptyProps(),
    'Cancel edit confirm clicked': emptyProps(),
    'Cancel edit not dirty': emptyProps(),
    'Edit button clicked': emptyProps(),
    'Save button clicked': props<{ details: Agent }>(),
    'Cancel button clicked': props<{ dirty: boolean }>(),
    'Delete button clicked': emptyProps(),
    'Navigate back button clicked': emptyProps(),
    'Back navigation started': emptyProps(),
    'Back navigation failed': emptyProps(),
    'Navigation to search started': emptyProps(),
    'Navigation to search not started': emptyProps()
  }
})

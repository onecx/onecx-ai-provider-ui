import { createActionGroup, emptyProps, props } from '@ngrx/store'
import { MCPServer } from '../../../shared/generated'

export const MCPServerDetailsActions = createActionGroup({
  source: 'MCPServerDetails',
  events: {
    'navigated to details page': props<{
      id: string | undefined
    }>(),
    'MCPServer details received': props<{
      details: MCPServer
    }>(),
    'MCPServer reloaded details received': props<{
      details: MCPServer
    }>(),
    'MCPServer details loading failed': props<{ error: string | null }>(),
    'edit mode set': props<{ editMode: boolean }>(),
    'Update MCPServer cancelled': emptyProps(),
    'Update MCPServer succeeded': emptyProps(),
    'Update MCPServer failed': props<{
      error: string | null
    }>(),
    'Delete MCPServer cancelled': emptyProps(),
    'Delete MCPServer succeeded': emptyProps(),
    'Delete MCPServer failed': props<{
      error: string | null
    }>(),
    'cancel edit back clicked': emptyProps(),
    'cancel edit confirm clicked': emptyProps(),
    'edit button clicked': emptyProps(),
    'save button clicked': props<{
      details: MCPServer
    }>(),
    'cancel button clicked': props<{
      dirty: boolean
    }>(),
    'delete button clicked': emptyProps(),
    'navigate back button clicked': emptyProps(),
    'back navigation started': emptyProps(),
    'back navigation failed': emptyProps(),
    'navigation to search started': emptyProps(),
    'navigation to search not started': emptyProps(),
    'api key visibility toggled': emptyProps(),
  }
})

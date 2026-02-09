import { createActionGroup, emptyProps, props } from '@ngrx/store'
import { Configuration, MCPServer, Provider } from '../../../shared/generated'

export const ConfigurationDetailsActions = createActionGroup({
  source: 'ConfigurationDetails',
  events: {
    'navigated to details page': props<{
      id: string | undefined
    }>(),
    'configuration details received': props<{
      details: Configuration
    }>(),
    'configuration reloaded details received': props<{
      details: Configuration
    }>(),
    'configuration details loading failed': props<{ error: string | null }>(),

    'configuration providers received': props<{
      providers: Provider[]
    }>(),
    'configuration reloaded providers received': props<{
      providers: Provider[]
    }>(),
    'configuration providers loading failed': props<{ error: string | null }>(),

    'configuration MCPServers received': props<{
      MCPServers: MCPServer[]
    }>(),
    'configuration reloaded MCPServers received': props<{
      MCPServers: MCPServer[]
    }>(),
    'configuration MCPServers loading failed': props<{ error: string | null }>(),

    'edit mode set': props<{ editMode: boolean }>(),
    'Update configuration cancelled': emptyProps(),
    'Update configuration succeeded': emptyProps(),
    'Update configuration failed': props<{
      error: string | null
    }>(),
    'Delete configuration cancelled': emptyProps(),
    'Delete configuration succeeded': emptyProps(),
    'Delete configuration failed': props<{
      error: string | null
    }>(),
    'cancel edit back clicked': emptyProps(),
    'cancel edit confirm clicked': emptyProps(),
    'cancel edit not dirty': emptyProps(),
    'edit button clicked': emptyProps(),
    'save button clicked': props<{
      details: Configuration
    }>(),
    'cancel button clicked': props<{
      dirty: boolean
    }>(),
    'delete button clicked': emptyProps(),
    'navigate back button clicked': emptyProps(),
    'back navigation started': emptyProps(),
    'back navigation failed': emptyProps(),
    'navigation to search started': emptyProps(),
    'navigation to search not started': emptyProps()
  }
})

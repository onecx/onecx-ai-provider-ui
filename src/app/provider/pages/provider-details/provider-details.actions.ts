import { createActionGroup, emptyProps, props } from '@ngrx/store'
import { Provider } from '../../../shared/generated'

export const ProviderDetailsActions = createActionGroup({
  source: 'ProviderDetails',
  events: {
    'navigated to details page': props<{
      id: string | undefined
    }>(),
    'provider details received': props<{
      details: Provider
    }>(),
    'provider details loading failed': props<{ error: string | null }>(),
    'provider details edit mode set': props<{ editMode: boolean }>(),
    'api key visibility toggled': emptyProps(),
  }
})

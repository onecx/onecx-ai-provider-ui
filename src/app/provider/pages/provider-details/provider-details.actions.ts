import { createActionGroup, emptyProps, props } from '@ngrx/store'
import { Model, Provider } from 'src/app/shared/generated'

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
    'provider update requested': props<{ details: Provider }>(),
    'provider update succeeded': props<{ details: Provider }>(),
    'provider update failed': props<{ error: string | null }>(),
    'provider models load requested': props<{ providerId: string | undefined }>(),
    'provider models received': props<{ models: Model[] }>(),
    'provider models loading failed': props<{ error: string | null }>(),
    'provider model create clicked': props<{ modelIdentifier: string }>(),
    'provider model create succeeded': emptyProps(),
    'provider model create failed': props<{ error: string | null }>(),
    'provider model delete clicked': props<{ modelId: string }>(),
    'provider model delete succeeded': emptyProps(),
    'provider model delete failed': props<{ error: string | null }>(),
    'provider details edit mode set': props<{ editMode: boolean }>(),
    'api key visibility toggled': emptyProps()
  }
})

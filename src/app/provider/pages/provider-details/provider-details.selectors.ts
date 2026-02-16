import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { Provider } from '../../../shared/generated'
import { ProviderFeature } from '../../provider.reducers'
import { initialState } from './provider-details.reducers'
import { ProviderDetailsViewModel } from './provider-details.viewmodel'

export const ProviderDetailsSelectors = createChildSelectors(ProviderFeature.selectDetails, initialState)

export const selectProviderDetailsViewModel = createSelector(
  ProviderDetailsSelectors.selectDetails,
  ProviderDetailsSelectors.selectEditMode,
  ProviderDetailsSelectors.selectIsApiKeyHidden,
  (
    details: Provider | undefined, 
    editMode,
    isApiKeyHidden
  ): ProviderDetailsViewModel => ({
    details,
    editMode,
    isApiKeyHidden
  })
)

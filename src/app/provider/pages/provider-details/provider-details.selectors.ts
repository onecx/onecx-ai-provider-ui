import { createSelector } from '@ngrx/store'

import { createChildSelectors } from '@onecx/ngrx-accelerator'

import { Provider } from 'src/app/shared/generated'
import { initialState } from './provider-details.reducers'
import { ProviderDetailsViewModel } from './provider-details.viewmodel'
import { ProviderFeature } from '../../provider.reducers'

export const ProviderDetailsSelectors = createChildSelectors(ProviderFeature.selectDetails, initialState)

export const selectProviderDetailsViewModel = createSelector(
  ProviderDetailsSelectors.selectDetails,
  ProviderDetailsSelectors.selectModels,
  ProviderDetailsSelectors.selectModelsLoadingIndicator,
  ProviderDetailsSelectors.selectModelMutationInProgress,
  ProviderDetailsSelectors.selectIsSubmitting,
  ProviderDetailsSelectors.selectEditMode,
  ProviderDetailsSelectors.selectIsApiKeyHidden,
  (
    details: Provider | undefined,
    models,
    modelsLoadingIndicator,
    modelMutationInProgress,
    isSubmitting,
    editMode,
    isApiKeyHidden
  ): ProviderDetailsViewModel => ({
    details,
    models,
    modelsLoadingIndicator,
    modelMutationInProgress,
    isSubmitting,
    editMode,
    isApiKeyHidden
  })
)

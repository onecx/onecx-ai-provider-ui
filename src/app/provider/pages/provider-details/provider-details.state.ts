import { Model, Provider } from 'src/app/shared/generated'

export interface ProviderDetailsState {
  details: Provider | undefined
  models: Model[]
  modelsLoadingIndicator: boolean
  modelsLoaded: boolean
  isSubmitting: boolean
  modelMutationInProgress: boolean
  editMode: boolean
  isApiKeyHidden: boolean
}

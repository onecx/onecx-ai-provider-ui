import { Model, Provider } from 'src/app/shared/generated'

export interface ProviderDetailsViewModel {
  details: Provider | undefined
  models: Model[]
  modelsLoadingIndicator: boolean
  modelMutationInProgress: boolean
  isSubmitting: boolean
  editMode: boolean
  isApiKeyHidden: boolean
}

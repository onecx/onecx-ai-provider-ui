import { Provider } from 'src/app/shared/generated'

export interface ProviderDetailsViewModel {
  details: Provider | undefined
  editMode: boolean
  isApiKeyHidden: boolean
}

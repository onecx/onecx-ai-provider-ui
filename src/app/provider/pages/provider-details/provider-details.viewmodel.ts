import { Provider } from '../../../shared/generated'

export interface ProviderDetailsViewModel {
  details: Provider | undefined,
  editMode: boolean,
  isApiKeyHidden: boolean
}

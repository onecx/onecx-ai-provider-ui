import { Provider } from '../../../shared/generated'

export interface ProviderDetailsState {
  details: Provider | undefined,
  editMode: boolean,
  isApiKeyHidden: boolean
}

import { Provider } from 'src/app/shared/generated'

export interface ProviderDetailsState {
  details: Provider | undefined
  editMode: boolean
  isApiKeyHidden: boolean
}

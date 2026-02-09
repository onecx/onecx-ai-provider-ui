import { ProviderDetailsState } from './pages/provider-details/provider-details.state'
import { ProviderSearchState } from './pages/provider-search/provider-search.state'
export interface ProviderState {
  details: ProviderDetailsState

  search: ProviderSearchState
}

import { ConfigurationDetailsState } from './pages/configuration-details/configuration-details.state'
import { ConfigurationSearchState } from './pages/configuration-search/configuration-search.state'
export interface ConfigurationState {
  details: ConfigurationDetailsState
  search: ConfigurationSearchState
}

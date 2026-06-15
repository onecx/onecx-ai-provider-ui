import { ScaffoldDetailsState } from './pages/scaffold-details/scaffold-details.state'
import { ScaffoldSearchState } from './pages/scaffold-search/scaffold-search.state'

export interface ScaffoldState {
  details: ScaffoldDetailsState
  search: ScaffoldSearchState
}

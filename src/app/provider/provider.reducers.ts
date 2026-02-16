import { combineReducers, createFeature } from '@ngrx/store'
import { ProviderState } from './provider.state'
import { ProviderDetailsReducer } from './pages/provider-details/provider-details.reducers'
import { ProviderSearchReducer } from './pages/provider-search/provider-search.reducers'

export const ProviderFeature = createFeature({
  name: 'Provider',
  reducer: combineReducers<ProviderState>({
    details: ProviderDetailsReducer,
    search: ProviderSearchReducer
  })
})

import { combineReducers, createFeature } from '@ngrx/store'
import { ConfigurationState } from './configuration.state'
import { configurationDetailsReducer } from './pages/configuration-details/configuration-details.reducers'
import { configurationSearchReducer } from './pages/configuration-search/configuration-search.reducers'

export const configurationFeature = createFeature({
  name: 'configuration',
  reducer: combineReducers<ConfigurationState>({
    details: configurationDetailsReducer,
    search: configurationSearchReducer
  })
})

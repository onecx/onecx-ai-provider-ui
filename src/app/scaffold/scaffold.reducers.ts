import { combineReducers, createFeature } from '@ngrx/store'
import { scaffoldSearchReducer } from './pages/scaffold-search/scaffold-search.reducers'

import { ScaffoldState } from './scaffold.state'

export const scaffoldFeature = createFeature({
  name: 'scaffold',
  reducer: combineReducers<ScaffoldState>({
    search: scaffoldSearchReducer
  })
})

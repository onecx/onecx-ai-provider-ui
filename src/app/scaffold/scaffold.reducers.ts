import { combineReducers, createFeature } from '@ngrx/store'

import { ScaffoldState } from './scaffold.state'

export const scaffoldFeature = createFeature({
  name: 'scaffold',
  reducer: combineReducers<ScaffoldState>({})
})

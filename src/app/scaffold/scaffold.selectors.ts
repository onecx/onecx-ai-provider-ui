import { createFeatureSelector } from '@ngrx/store'
import { scaffoldFeature } from './scaffold.reducers'
import { ScaffoldState } from './scaffold.state'

export const selectScaffoldFeature = createFeatureSelector<ScaffoldState>(scaffoldFeature.name)

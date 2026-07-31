import { combineReducers, createFeature } from '@ngrx/store'

import { dashboardReducer } from './pages/dashboard/dashboard.reducers'
import { DashboardState } from './dashboard.state'

export const dashboardFeature = createFeature({
  name: 'dashboard',
  reducer: combineReducers<DashboardState>({
    dashboard: dashboardReducer
  })
})

import { createFeatureSelector } from '@ngrx/store'

import { dashboardFeature } from './dashboard.reducers'
import { DashboardState } from './dashboard.state'

export const selectDashboardFeature = createFeatureSelector<DashboardState>(dashboardFeature.name)

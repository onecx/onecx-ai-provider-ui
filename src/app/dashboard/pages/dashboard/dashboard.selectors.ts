import { createSelector } from '@ngrx/store'

import { createChildSelectors } from '@onecx/ngrx-accelerator'

import { dashboardFeature } from '../../dashboard.reducers'
import { initialState } from './dashboard.reducers'
import { DashboardViewModel } from './dashboard.viewmodel'

export const dashboardSelectors = createChildSelectors(dashboardFeature.selectDashboard, initialState)

export const selectDashboardViewModel = createSelector((): DashboardViewModel => ({}))

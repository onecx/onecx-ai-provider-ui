import { createReducer } from '@ngrx/store'

import { DashboardState } from './dashboard.state'

export const initialState: DashboardState = {}

export const dashboardReducer = createReducer(initialState)

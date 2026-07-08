import { Action } from '@ngrx/store'

import { DashboardActions } from './dashboard.actions'
import { dashboardReducer, initialState } from './dashboard.reducers'

describe('dashboardReducer', () => {
  it('should return initial state for unknown action', () => {
    const action = { type: 'Unknown' } as Action

    const state = dashboardReducer(undefined, action)

    expect(state).toEqual(initialState)
  })

  it('should keep state unchanged for sample action', () => {
    const previousState = { ...initialState }

    const state = dashboardReducer(previousState, DashboardActions.sampleAction())

    expect(state).toEqual(previousState)
  })
})
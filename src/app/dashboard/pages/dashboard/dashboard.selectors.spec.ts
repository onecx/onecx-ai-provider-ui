import { dashboardSelectors, selectDashboardViewModel } from './dashboard.selectors'

describe('dashboard selectors', () => {
  it('selectDashboardViewModel should return an empty view model object', () => {
    expect(selectDashboardViewModel.projector()).toEqual({})
  })

  it('dashboardSelectors should not contain child selectors for empty state', () => {
    expect(dashboardSelectors).toEqual({})
  })
})
import { createActionGroup, emptyProps } from '@ngrx/store'

export const DashboardActions = createActionGroup({
  source: 'Dashboard',
  events: {
    'sample action': emptyProps()
  }
})

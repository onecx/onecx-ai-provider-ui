import { DashboardComponent } from './pages/dashboard/dashboard.component'
import { routes } from './dashboard.routes'

describe('dashboard routes', () => {
  it('should expose a default full-match route to DashboardComponent', () => {
    expect(routes).toHaveLength(1)
    expect(routes[0]).toEqual({
      path: '',
      component: DashboardComponent,
      pathMatch: 'full'
    })
  })
})
import { routes } from './scaffold.routes'
import { ScaffoldDetailsComponent } from './pages/scaffold-details/scaffold-details.component'
import { ScaffoldSearchComponent } from './pages/scaffold-search/scaffold-search.component'

describe('scaffold.routes', () => {
  it('should have 2 routes with correct components', () => {
    expect(routes.length).toBe(2)
    expect(routes[0]).toEqual({
      path: 'details/:id',
      component: ScaffoldDetailsComponent,
      pathMatch: 'full'
    })
    expect(routes[1]).toEqual({
      path: '',
      component: ScaffoldSearchComponent,
      pathMatch: 'full'
    })
  })
})

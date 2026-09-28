import { Routes } from '@angular/router'

import { ScaffoldDetailsComponent } from './pages/scaffold-details/scaffold-details.component'
import { ScaffoldSearchComponent } from './pages/scaffold-search/scaffold-search.component'

export const routes: Routes = [
  {
    path: 'details/:id',
    component: ScaffoldDetailsComponent,
    pathMatch: 'full',
    data: { breadcrumb: 'SCAFFOLD_DETAILS.BREADCRUMB' }
  },
  {
    path: '',
    component: ScaffoldSearchComponent,
    pathMatch: 'full',
    data: { breadcrumb: 'SCAFFOLD_SEARCH.BREADCRUMB' }
  }
]

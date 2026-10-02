import { Routes } from '@angular/router'

import { ScaffoldDetailsComponent } from './pages/scaffold-details/scaffold-details.component'
import { ScaffoldSearchComponent } from './pages/scaffold-search/scaffold-search.component'
import { LabelResolver } from '../shared/label.resolver'

export const routes: Routes = [
  {
    path: 'details/:id',
    component: ScaffoldDetailsComponent,
    pathMatch: 'full',
    data: { breadcrumb: 'SCAFFOLD_DETAILS.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver }
  },
  {
    path: '',
    component: ScaffoldSearchComponent,
    pathMatch: 'full',
    data: { breadcrumb: 'SCAFFOLD_SEARCH.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver }
  }
]

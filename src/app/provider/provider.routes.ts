import { Routes } from '@angular/router'

import { ProviderDetailsComponent } from './pages/provider-details/provider-details.component'
import { ProviderSearchComponent } from './pages/provider-search/provider-search.component'
import { LabelResolver } from '../shared/label.resolver'

export const routes: Routes = [
  {
    path: 'details/:id',
    component: ProviderDetailsComponent,
    pathMatch: 'full',
    data: { breadcrumb: 'PROVIDER_DETAILS.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver }
  },
  {
    path: '',
    component: ProviderSearchComponent,
    pathMatch: 'full',
    data: { breadcrumb: 'PROVIDER_SEARCH.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver }
  }
]

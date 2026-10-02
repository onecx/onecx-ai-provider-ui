import { Routes } from '@angular/router'

import { MCPServerDetailsComponent } from './pages/mcpserver-details/mcpserver-details.component'
import { MCPServerSearchComponent } from './pages/mcpserver-search/mcpserver-search.component'
import { LabelResolver } from '../shared/label.resolver'

export const routes: Routes = [
  {
    path: 'details/:id',
    component: MCPServerDetailsComponent,
    pathMatch: 'full',
    data: { breadcrumb: 'MCPSERVER_DETAILS.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver }
  },
  {
    path: '',
    component: MCPServerSearchComponent,
    pathMatch: 'full',
    data: { breadcrumb: 'MCPSERVER_SEARCH.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver }
  }
]

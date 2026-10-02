import { Routes } from '@angular/router'

import { AgentDetailsComponent } from './pages/agent-details/agent-details.component'
import { AgentSearchComponent } from './pages/agent-search/agent-search.component'
import { LabelResolver } from '../shared/label.resolver'

export const routes: Routes = [
  {
    path: 'details/:id',
    component: AgentDetailsComponent,
    pathMatch: 'full',
    data: { breadcrumb: 'AGENT_DETAILS.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver }
  },
  {
    path: '',
    component: AgentSearchComponent,
    pathMatch: 'full',
    data: { breadcrumb: 'AGENT_SEARCH.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver }
  }
]

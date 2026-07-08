import { Routes } from '@angular/router'
import { AgentDetailsComponent } from './pages/agent-details/agent-details.component'
import { AgentSearchComponent } from './pages/agent-search/agent-search.component'

export const routes: Routes = [
  { path: 'details/:id', component: AgentDetailsComponent, pathMatch: 'full' },
  { path: '', component: AgentSearchComponent, pathMatch: 'full' }
]

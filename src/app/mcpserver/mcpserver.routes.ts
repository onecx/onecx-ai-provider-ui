import { Routes } from '@angular/router'
import { MCPServerDetailsComponent } from './pages/mcpserver-details/mcpserver-details.component'
import { MCPServerSearchComponent } from './pages/mcpserver-search/mcpserver-search.component'

export const routes: Routes = [
  { path: 'details/:id', component: MCPServerDetailsComponent, pathMatch: 'full' },
  { path: '', component: MCPServerSearchComponent, pathMatch: 'full' }
]

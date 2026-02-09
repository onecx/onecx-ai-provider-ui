import { Routes } from '@angular/router'
import { ProviderDetailsComponent } from './pages/provider-details/provider-details.component'
import { ProviderSearchComponent } from './pages/provider-search/provider-search.component'

export const routes: Routes = [
  { path: 'details/:id', component: ProviderDetailsComponent, pathMatch: 'full' },
  { path: '', component: ProviderSearchComponent, pathMatch: 'full' }
]

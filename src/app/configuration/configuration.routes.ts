import { Routes } from '@angular/router'
import { ConfigurationDetailsComponent } from './pages/configuration-details/configuration-details.component'
import { ConfigurationSearchComponent } from './pages/configuration-search/configuration-search.component'

export const routes: Routes = [
  { path: 'details/:id', component: ConfigurationDetailsComponent, pathMatch: 'full' },
  { path: '', component: ConfigurationSearchComponent, pathMatch: 'full' }
]

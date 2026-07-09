import { Routes } from '@angular/router'
import { SkillDetailsComponent } from './pages/skill-details/skill-details.component'
import { SkillSearchComponent } from './pages/skill-search/skill-search.component'

export const routes: Routes = [
  { path: 'details/:id', component: SkillDetailsComponent, pathMatch: 'full' },
  { path: '', component: SkillSearchComponent, pathMatch: 'full' }
]

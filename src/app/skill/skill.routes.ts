import { Routes } from '@angular/router'

import { SkillDetailsComponent } from './pages/skill-details/skill-details.component'
import { SkillSearchComponent } from './pages/skill-search/skill-search.component'

export const routes: Routes = [
  {
    path: 'details/:id',
    component: SkillDetailsComponent,
    pathMatch: 'full',
    data: { breadcrumb: 'SKILL_DETAILS.BREADCRUMB' }
  },
  {
    path: '',
    component: SkillSearchComponent,
    pathMatch: 'full',
    data: { breadcrumb: 'SKILL_SEARCH.BREADCRUMB' }
  }
]

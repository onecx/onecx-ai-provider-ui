import { Routes } from '@angular/router'

import { SkillDetailsComponent } from './pages/skill-details/skill-details.component'
import { SkillSearchComponent } from './pages/skill-search/skill-search.component'
import { LabelResolver } from '../shared/label.resolver'

export const routes: Routes = [
  {
    path: 'details/:id',
    component: SkillDetailsComponent,
    pathMatch: 'full',
    data: { breadcrumb: 'SKILL_DETAILS.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver }
  },
  {
    path: '',
    component: SkillSearchComponent,
    pathMatch: 'full',
    data: { breadcrumb: 'SKILL_SEARCH.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver }
  }
]

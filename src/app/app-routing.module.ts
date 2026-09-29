import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'

import { startsWith } from '@onecx/angular-webcomponents'
import { LabelResolver } from './shared/label.resolver'

export const routes: Routes = [
  {
    // Adjust the matcher to match the feature route.
    // If you only have one feature, you can use '' for simplification.
    matcher: startsWith('scaffold'),
    data: { breadcrumb: 'SCAFFOLD_SEARCH.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver },
    loadChildren: () => import('./scaffold/scaffold.module').then((mod) => mod.ScaffoldModule)
  },
  {
    matcher: startsWith('skill'),
    data: { breadcrumb: 'SKILL_SEARCH.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver },
    loadChildren: () => import('./skill/skill.module').then((mod) => mod.SkillModule)
  },
  {
    // Adjust the matcher to match the feature route.
    // If you only have one feature, you can use '' for simplification.
    matcher: startsWith('agent'),
    data: { breadcrumb: 'AGENT_SEARCH.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver },
    loadChildren: () => import('./agent/agent.module').then((mod) => mod.AgentModule)
  },
  {
    matcher: startsWith('dashboard'),
    data: { breadcrumb: 'DASHBOARD.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver },
    loadChildren: () => import('./dashboard/dashboard.module').then((mod) => mod.DashboardModule)
  },
  {
    matcher: startsWith('mcpserver'),
    data: { breadcrumb: 'MCPSERVER_SEARCH.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver },
    loadChildren: () => import('./mcpserver/mcpserver.module').then((mod) => mod.MCPServerModule)
  },
  {
    matcher: startsWith('provider'),
    data: { breadcrumb: 'PROVIDER_SEARCH.HEADER', breadcrumbFn: (data: any) => `${data.labeli18n}` },
    resolve: { labeli18n: LabelResolver },
    loadChildren: () => import('./provider/provider.module').then((mod) => mod.ProviderModule)
  },
  {
    matcher: startsWith(''),
    redirectTo: 'dashboard'
  }
]

@NgModule({
  imports: [RouterModule.forRoot(routes), TranslateModule],
  exports: [RouterModule]
})
export class AppRoutingModule {}

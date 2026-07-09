import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { startsWith } from '@onecx/angular-webcomponents'
export const routes: Routes = [
  {
    // Adjust the matcher to match the feature route.
    // If you only have one feature, you can use '' for simplification.
    matcher: startsWith('skill'),
    loadChildren: () => import('./skill/skill.module').then((mod) => mod.SkillModule)
  },
  {
    // Adjust the matcher to match the feature route.
    // If you only have one feature, you can use '' for simplification.
    matcher: startsWith('agent'),
    loadChildren: () => import('./agent/agent.module').then((mod) => mod.AgentModule)
  },
  {
    matcher: startsWith('dashboard'),
    loadChildren: () => import('./dashboard/dashboard.module').then((mod) => mod.DashboardModule)
  },
  {
    matcher: startsWith('mcpserver'),
    loadChildren: () => import('./mcpserver/mcpserver.module').then((mod) => mod.MCPServerModule)
  },
  {
    matcher: startsWith(''),
    loadChildren: () => import('./dashboard/dashboard.module').then((mod) => mod.DashboardModule)
  },
  {
    matcher: startsWith('provider'),
    loadChildren: () => import('./provider/provider.module').then((mod) => mod.ProviderModule)
  }
]

@NgModule({
  imports: [RouterModule.forRoot(routes), TranslateModule],
  exports: [RouterModule]
})
export class AppRoutingModule {}

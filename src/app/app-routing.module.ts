import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { startsWith } from '@onecx/angular-webcomponents'
export const routes: Routes = [
  {
    matcher: startsWith('mcpserver'),
    loadChildren: () => import('./mcpserver/mcpserver.module').then((mod) => mod.MCPServerModule)
  },
  {
    matcher: startsWith(''),
    loadChildren: () => import('./configuration/configuration.module').then((mod) => mod.ConfigurationModule)
  },
  {
    matcher: startsWith('configuration'),
    loadChildren: () => import('./configuration/configuration.module').then((mod) => mod.ConfigurationModule)
  },
  {
    matcher: startsWith('provider'),
    loadChildren: () => import('./provider/provider.module').then((mod) => mod.ProviderModule)
  },
  {
    matcher: startsWith('scaffold'),
    loadChildren: () => import('./scaffold/scaffold.module').then((mod) => mod.ScaffoldModule)
  }
]

@NgModule({
  imports: [RouterModule.forRoot(routes), TranslateModule],
  exports: [RouterModule]
})
export class AppRoutingModule {}

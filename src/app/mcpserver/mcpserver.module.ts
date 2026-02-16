import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { TranslateModule } from '@ngx-translate/core'
import { PortalCoreModule, providePortalDialogService } from '@onecx/portal-integration-angular'
import { CalendarModule } from 'primeng/calendar'
import { SharedModule } from '../shared/shared.module'
import { mcpserverFeature } from './mcpserver.reducers'
import { routes } from './mcpserver.routes'
import { MCPServerDetailsComponent } from './pages/mcpserver-details/mcpserver-details.component'
import { MCPServerSearchComponent } from './pages/mcpserver-search/mcpserver-search.component'
import { MCPServerDetailsEffects } from './pages/mcpserver-details/mcpserver-details.effects'
import { MCPServerSearchEffects } from './pages/mcpserver-search/mcpserver-search.effects'
import { addInitializeModuleGuard } from '@onecx/angular-integration-interface'

@NgModule({
  providers: [providePortalDialogService()],
  declarations: [MCPServerDetailsComponent, MCPServerSearchComponent],
  imports: [
    CommonModule,
    SharedModule,
    LetDirective,
    PortalCoreModule.forMicroFrontend(),
    RouterModule.forChild(addInitializeModuleGuard(routes)),
    FormsModule,
    ReactiveFormsModule,
    CalendarModule,
    StoreModule.forFeature(mcpserverFeature),
    EffectsModule.forFeature([MCPServerDetailsEffects, MCPServerSearchEffects]),
    TranslateModule
  ]
})
export class MCPServerModule {}

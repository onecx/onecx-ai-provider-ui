import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { TranslateModule } from '@ngx-translate/core'
import { DatePickerModule } from 'primeng/datepicker'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { MultiSelectModule } from 'primeng/multiselect'
import { TooltipModule } from 'primeng/tooltip'

import { AngularAcceleratorModule, providePortalDialogService } from '@onecx/angular-accelerator'
import { providePermissionService } from '@onecx/angular-utils'

import { SharedModule } from 'src/app/shared/shared.module'
import { mcpserverFeature } from './mcpserver.reducers'
import { routes } from './mcpserver.routes'
import { MCPServerDetailsComponent } from './pages/mcpserver-details/mcpserver-details.component'
import { MCPServerDetailsEffects } from './pages/mcpserver-details/mcpserver-details.effects'
import { McpserverCreateUpdateComponent } from './pages/mcpserver-search/dialogs/mcpserver-create-update/mcpserver-create-update.component'
import { MCPServerSearchComponent } from './pages/mcpserver-search/mcpserver-search.component'
import { MCPServerSearchEffects } from './pages/mcpserver-search/mcpserver-search.effects'

@NgModule({
  providers: [providePortalDialogService(), ...providePermissionService()],
  imports: [
    McpserverCreateUpdateComponent,
    FloatLabelModule,
    InputTextModule,
    CommonModule,
    SharedModule,
    LetDirective,
    AngularAcceleratorModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    DatePickerModule,
    TooltipModule,
    MultiSelectModule,
    MCPServerDetailsComponent,
    MCPServerSearchComponent,
    StoreModule.forFeature(mcpserverFeature),
    EffectsModule.forFeature([MCPServerDetailsEffects, MCPServerSearchEffects]),
    TranslateModule
  ]
})
export class MCPServerModule {}

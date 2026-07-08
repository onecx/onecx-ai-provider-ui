import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { TranslateModule } from '@ngx-translate/core'
import { AngularAcceleratorModule, providePortalDialogService } from '@onecx/angular-accelerator'
import { PermissionService, PortalPageComponent } from '@onecx/angular-utils'
import { AutoCompleteModule } from 'primeng/autocomplete'
import { ButtonModule } from 'primeng/button'
import { DatePickerModule } from 'primeng/datepicker'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { MultiSelectModule } from 'primeng/multiselect'
import { SelectModule } from 'primeng/select'
import { TabViewModule } from 'primeng/tabview'
import { AgentDetailsComponent } from './pages/agent-details/agent-details.component'
import { AgentDetailsEffects } from './pages/agent-details/agent-details.effects'
import { TooltipModule } from 'primeng/tooltip'
import { SharedModule } from '../shared/shared.module'
import { AgentSearchComponent } from './pages/agent-search/agent-search.component'
import { AgentSearchEffects } from './pages/agent-search/agent-search.effects'
import { agentFeature } from './agent.reducers'
import { routes } from './agent.routes'

@NgModule({
  providers: [providePortalDialogService(), PermissionService],
  declarations: [AgentDetailsComponent, AgentSearchComponent],
  imports: [
    FloatLabelModule,
    TabViewModule,
    SelectModule,
    MultiSelectModule,
    AutoCompleteModule,
    ButtonModule,
    InputTextModule,
    CommonModule,
    SharedModule,
    LetDirective,
    AngularAcceleratorModule,
    PortalPageComponent,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    DatePickerModule,
    TooltipModule,
    StoreModule.forFeature(agentFeature),
    EffectsModule.forFeature([AgentDetailsEffects, AgentSearchEffects]),
    TranslateModule
  ]
})
export class AgentModule {}

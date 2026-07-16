import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { TranslateModule } from '@ngx-translate/core'
import { AngularAcceleratorModule, providePortalDialogService } from '@onecx/angular-accelerator'
import { DatePickerModule } from 'primeng/datepicker'
import { TableModule } from 'primeng/table'
import { MultiSelectModule } from 'primeng/multiselect'
import { AutoCompleteModule } from 'primeng/autocomplete'
import { TooltipModule } from 'primeng/tooltip'
import { SelectModule } from 'primeng/select'
import { SharedModule } from 'src/app/shared/shared.module'
import { configurationFeature } from './configuration.reducers'
import { routes } from './configuration.routes'
import { providePermissionService } from '@onecx/angular-utils'
import { ConfigurationSearchComponent } from './pages/configuration-search/configuration-search.component'
import { ConfigurationSearchEffects } from './pages/configuration-search/configuration-search.effects'
import { ConfigurationCreateUpdateComponent } from './pages/configuration-search/dialogs/configuration-create-update/configuration-create-update.component'
import { ConfigurationDetailsComponent } from './pages/configuration-details/configuration-details.component'
import { ConfigurationDetailsEffects } from './pages/configuration-details/configuration-details.effects'

@NgModule({
  providers: [providePortalDialogService(), ...providePermissionService()],
  declarations: [],
  imports: [
    CommonModule,
    ConfigurationDetailsComponent,
    ConfigurationCreateUpdateComponent,
    ConfigurationSearchComponent,
    SharedModule,
    LetDirective,
    AngularAcceleratorModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    DatePickerModule,
    TableModule,
    MultiSelectModule,
    TooltipModule,
    SelectModule,
    AutoCompleteModule,
    StoreModule.forFeature(configurationFeature),
    EffectsModule.forFeature([ConfigurationDetailsEffects, ConfigurationSearchEffects]),
    TranslateModule
  ]
})
export class ConfigurationModule {}

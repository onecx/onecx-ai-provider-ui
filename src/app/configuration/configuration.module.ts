import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { TranslateModule } from '@ngx-translate/core'
import {  
  PortalCoreModule,
  providePortalDialogService
} from '@onecx/portal-integration-angular'
import { CalendarModule } from 'primeng/calendar'
import { TableModule } from 'primeng/table'
import { MultiSelectModule } from 'primeng/multiselect'
import { AutoCompleteModule } from 'primeng/autocomplete'
import { DropdownModule } from 'primeng/dropdown'
import { SharedModule } from '../shared/shared.module'
import { configurationFeature } from './configuration.reducers'
import { routes } from './configuration.routes'

import { ConfigurationSearchComponent } from './pages/configuration-search/configuration-search.component'
import { ConfigurationSearchEffects } from './pages/configuration-search/configuration-search.effects'
import { ConfigurationCreateUpdateComponent } from './pages/configuration-search/dialogs/configuration-create-update/configuration-create-update.component'
import { ConfigurationDetailsComponent } from './pages/configuration-details/configuration-details.component'
import { ConfigurationDetailsEffects } from './pages/configuration-details/configuration-details.effects'
import { addInitializeModuleGuard } from '@onecx/angular-integration-interface'

@NgModule({
  providers: [providePortalDialogService()],
  declarations: [ConfigurationDetailsComponent, ConfigurationCreateUpdateComponent, ConfigurationSearchComponent],
  imports: [
    CommonModule,
    SharedModule,
    LetDirective,
    PortalCoreModule.forMicroFrontend(),
    RouterModule.forChild(addInitializeModuleGuard(routes)),
    FormsModule,
    ReactiveFormsModule,
    CalendarModule,
    TableModule,
    MultiSelectModule,
    DropdownModule,
    AutoCompleteModule,
    StoreModule.forFeature(configurationFeature),
    EffectsModule.forFeature([ConfigurationDetailsEffects, ConfigurationSearchEffects]),
    TranslateModule
  ]
})
export class ConfigurationModule {}

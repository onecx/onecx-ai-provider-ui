import { CommonModule } from '@angular/common'
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { TranslateModule } from '@ngx-translate/core'
import { addInitializeModuleGuard } from '@onecx/angular-integration-interface'
import { PortalCoreModule, providePortalDialogService } from '@onecx/portal-integration-angular'
import { CalendarModule } from 'primeng/calendar'
import { SharedModule } from '../shared/shared.module'
import { ProviderFeature } from './provider.reducers'
import { routes } from './provider.routes'
import { ProviderDetailsComponent } from './pages/provider-details/provider-details.component'
import { ProviderDetailsEffects } from './pages/provider-details/provider-details.effects'
import { ProviderSearchComponent } from './pages/provider-search/provider-search.component'
import { ProviderSearchEffects } from './pages/provider-search/provider-search.effects'
import { ProviderCreateUpdateComponent } from './pages/provider-search/dialogs/provider-create-update/provider-create-update.component'

@NgModule({
  providers: [providePortalDialogService()],
  declarations: [
    ProviderCreateUpdateComponent,
    ProviderDetailsComponent,
    ProviderSearchComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    SharedModule,
    LetDirective,
    PortalCoreModule.forMicroFrontend(),
    RouterModule.forChild(addInitializeModuleGuard(routes)),
    FormsModule,
    ReactiveFormsModule,
    CalendarModule,
    StoreModule.forFeature(ProviderFeature),
    EffectsModule.forFeature([ProviderDetailsEffects, ProviderSearchEffects]),
    TranslateModule
  ]
})
export class ProviderModule {}

import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { TranslateModule } from '@ngx-translate/core'
import { ButtonModule } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { DatePickerModule } from 'primeng/datepicker'
import { TooltipModule } from 'primeng/tooltip'

import { AngularAcceleratorModule, providePortalDialogService } from '@onecx/angular-accelerator'
import { PermissionService, PortalPageComponent } from '@onecx/angular-utils'

import { DashboardComponent } from './pages/dashboard/dashboard.component'
import { DashboardEffects } from './pages/dashboard/dashboard.effects'
import { dashboardFeature } from './dashboard.reducers'
import { routes } from './dashboard.routes'

@NgModule({
  providers: [providePortalDialogService(), PermissionService],
  imports: [
    DashboardComponent,
    LetDirective,
    AngularAcceleratorModule,
    PortalPageComponent,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    DatePickerModule,
    TooltipModule,
    StoreModule.forFeature(dashboardFeature),
    EffectsModule.forFeature([DashboardEffects]),
    TranslateModule
  ]
})
export class DashboardModule {}

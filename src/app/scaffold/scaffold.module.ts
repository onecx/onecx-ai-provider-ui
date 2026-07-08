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
import { TooltipModule } from 'primeng/tooltip'
import { SharedModule } from '../shared/shared.module'

import { PermissionService, PortalPageComponent } from '@onecx/angular-utils'
import { scaffoldFeature } from './scaffold.reducers'
import { routes } from './scaffold.routes'

@NgModule({
  providers: [providePortalDialogService(), PermissionService],
  declarations: [],
  imports: [
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
    StoreModule.forFeature(scaffoldFeature),
    EffectsModule.forFeature(),
    TranslateModule
  ]
})
export class ScaffoldModule {}

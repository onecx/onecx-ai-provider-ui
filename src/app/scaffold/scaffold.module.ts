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
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'
import { SharedModule } from '../shared/shared.module'
import { ScaffoldSearchComponent } from './pages/scaffold-search/scaffold-search.component'
import { ScaffoldSearchEffects } from './pages/scaffold-search/scaffold-search.effects'

import { PermissionService, PortalPageComponent } from '@onecx/angular-utils'
import { scaffoldFeature } from './scaffold.reducers'
import { routes } from './scaffold.routes'

@NgModule({
  providers: [providePortalDialogService(), PermissionService],
  declarations: [ScaffoldSearchComponent],
  imports: [
    FloatLabelModule,
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
    StoreModule.forFeature(scaffoldFeature),
    EffectsModule.forFeature([ScaffoldSearchEffects]),
    TranslateModule
  ]
})
export class ScaffoldModule {}

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
import { SharedModule } from 'src/app/shared/shared.module'
import { providePermissionService } from '@onecx/angular-utils'
import { scaffoldFeature } from './scaffold.reducers'
import { routes } from './scaffold.routes'
import { ScaffoldCreateUpdateComponent } from './pages/scaffold-search/dialogs/scaffold-create-update/scaffold-create-update.component'
import { ScaffoldDetailsComponent } from './pages/scaffold-details/scaffold-details.component'
import { ScaffoldDetailsEffects } from './pages/scaffold-details/scaffold-details.effects'
import { ScaffoldSearchComponent } from './pages/scaffold-search/scaffold-search.component'
import { ScaffoldSearchEffects } from './pages/scaffold-search/scaffold-search.effects'

@NgModule({
  providers: [providePortalDialogService(), ...providePermissionService()],
  declarations: [],
  imports: [
    CommonModule,
    SharedModule,
    LetDirective,
    AngularAcceleratorModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    DatePickerModule,
    ScaffoldCreateUpdateComponent,
    ScaffoldDetailsComponent,
    ScaffoldSearchComponent,
    StoreModule.forFeature(scaffoldFeature),
    EffectsModule.forFeature([ScaffoldDetailsEffects, ScaffoldSearchEffects]),
    TranslateModule
  ]
})
export class ScaffoldModule {}

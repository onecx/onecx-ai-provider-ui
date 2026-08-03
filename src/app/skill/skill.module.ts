import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { TranslateModule } from '@ngx-translate/core'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { DatePickerModule } from 'primeng/datepicker'
import { TooltipModule } from 'primeng/tooltip'

import { AngularAcceleratorModule, providePortalDialogService } from '@onecx/angular-accelerator'
import { providePermissionService } from '@onecx/angular-utils'

import { SharedModule } from 'src/app/shared/shared.module'
import { SkillDetailsComponent } from './pages/skill-details/skill-details.component'
import { SkillDetailsEffects } from './pages/skill-details/skill-details.effects'
import { SkillCreateUpdateComponent } from './pages/skill-search/dialogs/skill-create-update/skill-create-update.component'
import { SkillSearchComponent } from './pages/skill-search/skill-search.component'
import { SkillSearchEffects } from './pages/skill-search/skill-search.effects'
import { skillFeature } from './skill.reducers'
import { routes } from './skill.routes'

@NgModule({
  providers: [providePortalDialogService(), ...providePermissionService()],
  imports: [
    CommonModule,
    SkillCreateUpdateComponent,
    SkillDetailsComponent,
    SkillSearchComponent,
    SharedModule,
    LetDirective,
    AngularAcceleratorModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    FloatLabelModule,
    InputTextModule,
    DatePickerModule,
    TooltipModule,
    StoreModule.forFeature(skillFeature),
    EffectsModule.forFeature([SkillDetailsEffects, SkillSearchEffects]),
    TranslateModule
  ]
})
export class SkillModule {}

import { AsyncPipe } from '@angular/common'
import { Component, OnInit, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { Store } from '@ngrx/store'
import { LetDirective } from '@ngrx/component'
import { TranslateModule, TranslatePipe } from '@ngx-translate/core'
import { PrimeIcons } from 'primeng/api'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { Textarea } from 'primeng/textarea'
import { TooltipModule } from 'primeng/tooltip'
import { Observable, map } from 'rxjs'

import { Action, AngularAcceleratorModule, BreadcrumbService, ObjectDetailItem } from '@onecx/angular-accelerator'
import { PortalPageComponent } from '@onecx/angular-utils'

import { Skill } from 'src/app/shared/generated'
import { skillDetailsActions } from './skill-details.actions'
import { selectSkillDetailsViewModel } from './skill-details.selectors'
import { SkillDetailsViewModel } from './skill-details.viewmodel'

@Component({
  selector: 'app-skill-details',
  imports: [
    AsyncPipe,
    AngularAcceleratorModule,
    TranslateModule,
    FormsModule,
    FloatLabelModule,
    ReactiveFormsModule,
    LetDirective,
    InputTextModule,
    Textarea,
    PortalPageComponent,
    TooltipModule
  ],
  templateUrl: './skill-details.component.html',
  styleUrls: ['./skill-details.component.scss']
})
export class SkillDetailsComponent implements OnInit {
  private readonly store = inject(Store)
  private readonly breadcrumbService = inject(BreadcrumbService)

  viewModel$: Observable<SkillDetailsViewModel> = this.store.select(selectSkillDetailsViewModel)
  objectDetails$: Observable<ObjectDetailItem[]> = this.viewModel$.pipe(
    map((vm) => {
      const labels: ObjectDetailItem[] = [
        {
          label: 'SKILL_DETAILS.FORM.ID',
          labelPipe: TranslatePipe,
          value: vm.details?.id
        },
        {
          label: 'SKILL_DETAILS.FORM.SOURCE',
          labelPipe: TranslatePipe,
          value: vm.details?.source
        }
      ]
      return labels
    })
  )

  headerActions$: Observable<Action[]> = this.viewModel$.pipe(
    map((vm) => {
      const actions: Action[] = [
        {
          titleKey: 'SKILL_DETAILS.GENERAL.BACK',
          labelKey: 'SKILL_DETAILS.GENERAL.BACK',
          show: 'always',
          disabled: !vm.backNavigationPossible,
          showCondition: !vm.editMode,
          actionCallback: () => {
            this.store.dispatch(skillDetailsActions.navigateBackButtonClicked())
          }
        },
        {
          titleKey: 'SKILL_DETAILS.GENERAL.EDIT',
          labelKey: 'SKILL_DETAILS.GENERAL.EDIT',
          permission: 'SKILL#EDIT',
          show: 'always',
          icon: PrimeIcons.PENCIL,
          conditional: true,
          showCondition: !vm.editMode,
          actionCallback: () => {
            this.edit()
          }
        },
        {
          titleKey: 'SKILL_DETAILS.GENERAL.CANCEL',
          labelKey: 'SKILL_DETAILS.GENERAL.CANCEL',
          show: 'always',
          icon: PrimeIcons.TIMES,
          conditional: true,
          showCondition: vm.editMode,
          disabled: vm.isSubmitting,
          actionCallback: () => {
            this.cancel()
          }
        },
        {
          titleKey: 'SKILL_DETAILS.GENERAL.SAVE',
          labelKey: 'SKILL_DETAILS.GENERAL.SAVE',
          show: 'always',
          icon: PrimeIcons.SAVE,
          conditional: true,
          disabled: vm.isSubmitting,
          showCondition: vm.editMode,
          actionCallback: () => {
            this.save()
          }
        },
        {
          titleKey: 'SKILL_DETAILS.GENERAL.DELETE',
          labelKey: 'SKILL_DETAILS.GENERAL.DELETE',
          permission: 'SKILL#DELETE',
          icon: PrimeIcons.TRASH,
          show: 'asOverflow',
          btnClass: '',
          conditional: true,
          showCondition: !vm.editMode,
          actionCallback: () => {
            this.delete()
          }
        }
      ]
      return actions
    })
  )

  public formGroup: FormGroup
  private currentDetails: Skill | undefined

  constructor() {
    this.formGroup = new FormGroup({
      name: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.maxLength(255)]),
      instruction: new FormControl(null)
    })
    this.formGroup.disable()

    this.viewModel$.subscribe((vm) => {
      this.currentDetails = vm.details
      if (!vm.editMode) {
        this.formGroup.patchValue({
          name: vm.details?.name,
          description: vm.details?.description,
          instruction: vm.details?.instruction
        })
        this.formGroup.markAsPristine()
      }
      if (vm.editMode) {
        this.formGroup.enable()
      } else {
        this.formGroup.disable()
      }
    })
  }

  ngOnInit(): void {
    this.breadcrumbService.setItems([
      {
        titleKey: 'SKILL_DETAILS.BREADCRUMB',
        labelKey: 'SKILL_DETAILS.BREADCRUMB',
        routerLink: '/skill'
      }
    ])
  }

  edit() {
    this.store.dispatch(skillDetailsActions.editButtonClicked())
  }

  cancel() {
    this.store.dispatch(skillDetailsActions.cancelButtonClicked({ dirty: this.formGroup.dirty }))
  }

  save() {
    this.store.dispatch(
      skillDetailsActions.saveButtonClicked({
        details: { ...this.currentDetails, ...this.formGroup.value }
      })
    )
  }

  delete() {
    this.store.dispatch(skillDetailsActions.deleteButtonClicked())
  }
}

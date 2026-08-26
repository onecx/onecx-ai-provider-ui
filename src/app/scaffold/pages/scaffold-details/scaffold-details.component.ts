import { AsyncPipe } from '@angular/common'
import { Component, OnInit, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { TranslateModule, TranslatePipe } from '@ngx-translate/core'
import { PrimeIcons } from 'primeng/api'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { MultiSelectModule } from 'primeng/multiselect'
import { TabsModule } from 'primeng/tabs'
import { Observable, map } from 'rxjs'

import { Action, AngularAcceleratorModule, BreadcrumbService, ObjectDetailItem } from '@onecx/angular-accelerator'
import { PortalPageComponent } from '@onecx/angular-utils'

import { Scaffold, Skill, Tool } from 'src/app/shared/generated'
import { scaffoldDetailsActions } from './scaffold-details.actions'
import { selectScaffoldDetailsViewModel } from './scaffold-details.selectors'
import { ScaffoldDetailsViewModel } from './scaffold-details.viewmodel'

type ScaffoldWithTools = Scaffold & { tools?: Tool[] }

@Component({
  selector: 'app-scaffold-details',
  imports: [
    TranslateModule,
    MultiSelectModule,
    FloatLabelModule,
    InputTextModule,
    TabsModule,
    ReactiveFormsModule,
    AsyncPipe,
    AngularAcceleratorModule,
    PortalPageComponent,
    LetDirective
  ],
  templateUrl: './scaffold-details.component.html',
  styleUrls: ['./scaffold-details.component.scss']
})
export class ScaffoldDetailsComponent implements OnInit {
  private readonly store = inject(Store)
  private readonly breadcrumbService = inject(BreadcrumbService)

  viewModel$: Observable<ScaffoldDetailsViewModel> = this.store.select(selectScaffoldDetailsViewModel)
  objectDetails$: Observable<ObjectDetailItem[]> = this.viewModel$.pipe(
    map((vm) => {
      const labels: ObjectDetailItem[] = [
        //ACTION D1: Add header values here
        {
          label: 'SCAFFOLD_DETAILS.FORM.NAME',
          labelPipe: TranslatePipe,
          value: vm.details?.name
        },
        {
          label: 'SCAFFOLD_DETAILS.FORM.SOURCE',
          labelPipe: TranslatePipe,
          value: vm.details?.source
        },
        {
          label: 'SCAFFOLD_DETAILS.FORM.SOURCE_PRODUCT',
          labelPipe: TranslatePipe,
          value: vm.details?.sourceProduct
        }
      ]
      return labels
    })
  )

  headerActions$: Observable<Action[]> = this.viewModel$.pipe(
    map((vm) => {
      const actions: Action[] = [
        {
          titleKey: 'SCAFFOLD_DETAILS.GENERAL.BACK',
          labelKey: 'SCAFFOLD_DETAILS.GENERAL.BACK',
          show: 'always',
          disabled: !vm.backNavigationPossible,
          showCondition: !vm.editMode,
          actionCallback: () => {
            this.store.dispatch(scaffoldDetailsActions.navigateBackButtonClicked())
          }
        },
        {
          titleKey: 'SCAFFOLD_DETAILS.GENERAL.EDIT',
          labelKey: 'SCAFFOLD_DETAILS.GENERAL.EDIT',
          permission: 'SCAFFOLD#EDIT',
          show: 'always',
          icon: PrimeIcons.PENCIL,
          conditional: true,
          showCondition: !vm.editMode,
          actionCallback: () => {
            this.edit()
          }
        },
        {
          titleKey: 'SCAFFOLD_DETAILS.GENERAL.CANCEL',
          labelKey: 'SCAFFOLD_DETAILS.GENERAL.CANCEL',
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
          titleKey: 'SCAFFOLD_DETAILS.GENERAL.SAVE',
          labelKey: 'SCAFFOLD_DETAILS.GENERAL.SAVE',
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
          titleKey: 'SCAFFOLD_DETAILS.GENERAL.DELETE',
          labelKey: 'SCAFFOLD_DETAILS.GENERAL.DELETE',
          permission: 'SCAFFOLD#DELETE',
          icon: PrimeIcons.TRASH,
          show: 'always',
          btnClass: '',
          conditional: true,
          showCondition: !vm.editMode,
          actionCallback: () => {
            this.delete()
          }
        },
        {
          titleKey: 'SCAFFOLD_DETAILS.GENERAL.MORE',
          icon: PrimeIcons.ELLIPSIS_V,
          show: 'always',
          btnClass: '',
          actionCallback: () => {
            return
          }
        }
      ]
      return actions
    })
  )

  public formGroup: FormGroup
  private currentDetails: ScaffoldWithTools | undefined

  constructor() {
    this.formGroup = new FormGroup({
      //ACTION D1: Add form fields here
      name: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      systemPrompt: new FormControl(null, [Validators.maxLength(4000)]),
      skills: new FormControl<Skill[]>([]),
      tools: new FormControl<Tool[]>([])
    })
    this.formGroup.disable()

    this.viewModel$.subscribe((vm) => {
      this.currentDetails = vm.details as ScaffoldWithTools | undefined
      if (!vm.editMode) {
        this.formGroup.patchValue({
          //ACTION D1: Add form fields here
          name: vm.details?.name,
          systemPrompt: vm.details?.systemPrompt,
          skills: vm.details?.skills ?? [],
          tools: (vm.details as ScaffoldWithTools | undefined)?.tools ?? []
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
        titleKey: 'SCAFFOLD_DETAILS.BREADCRUMB',
        labelKey: 'SCAFFOLD_DETAILS.BREADCRUMB',
        routerLink: '/scaffold'
      }
    ])
  }

  edit() {
    this.store.dispatch(scaffoldDetailsActions.editButtonClicked())
  }

  cancel() {
    this.store.dispatch(scaffoldDetailsActions.cancelButtonClicked({ dirty: this.formGroup.dirty }))
  }

  save() {
    const details: ScaffoldWithTools = {
      ...this.currentDetails,
      ...this.formGroup.value,
      tools: (this.formGroup.get('tools')?.value as Tool[]) ?? []
    }

    this.store.dispatch(
      scaffoldDetailsActions.saveButtonClicked({
        details
      })
    )
  }

  delete() {
    this.store.dispatch(scaffoldDetailsActions.deleteButtonClicked())
  }
}

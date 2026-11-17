import { AsyncPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { TranslateModule, TranslatePipe } from '@ngx-translate/core'
import { catchError, map, Observable, of } from 'rxjs'
import { PrimeIcons } from 'primeng/api'
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { PasswordModule } from 'primeng/password'
import { SelectModule } from 'primeng/select'

import { Action, AngularAcceleratorModule, BreadcrumbService, ObjectDetailItem } from '@onecx/angular-accelerator'
import { PortalPageComponent } from '@onecx/angular-utils'
import { UserService } from '@onecx/angular-integration-interface'
import { ApplicationInfo, ApplicationService, AuthMode, ExecutionPolicy } from 'src/app/shared/generated'

import { MCPServerDetailsActions } from './mcpserver-details.actions'
import { selectMCPServerDetailsViewModel } from './mcpserver-details.selectors'
import { MCPServerDetailsViewModel } from './mcpserver-details.viewmodel'

@Component({
  selector: 'app-mcpserver-details',
  imports: [
    AsyncPipe,
    AngularAcceleratorModule,
    LetDirective,
    FloatLabelModule,
    AutoCompleteModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    TranslateModule,
    ReactiveFormsModule,
    PortalPageComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mcpserver-details.component.html',
  styleUrls: ['./mcpserver-details.component.scss']
})
export class MCPServerDetailsComponent implements OnInit {
  viewModel$: Observable<MCPServerDetailsViewModel> = this.store.select(selectMCPServerDetailsViewModel)

  headerLabels$: Observable<ObjectDetailItem[]> = this.viewModel$.pipe(
    map((vm) => {
      const labels: ObjectDetailItem[] = [
        {
          label: 'MCPSERVER_DETAILS.FORM.NAME',
          labelPipe: TranslatePipe,
          value: vm.details?.name
        },
        {
          label: 'MCPSERVER_DETAILS.FORM.URL',
          labelPipe: TranslatePipe,
          value: vm.details?.url
        }
      ]
      return labels
    })
  )

  headerActions$: Observable<Action[]> = this.viewModel$.pipe(
    map((vm) => {
      const actions: Action[] = [
        {
          titleKey: 'MCPSERVER_DETAILS.GENERAL.BACK',
          labelKey: 'MCPSERVER_DETAILS.GENERAL.BACK',
          show: 'always',
          permission: 'MCPSERVER#BACK',
          showCondition: !vm.editMode,
          actionCallback: () => {
            globalThis.history.back()
          }
        },
        {
          titleKey: 'MCPSERVER_DETAILS.GENERAL.EDIT',
          labelKey: 'MCPSERVER_DETAILS.GENERAL.EDIT',
          show: 'always',
          icon: PrimeIcons.PENCIL,
          conditional: true,
          showCondition: !vm.editMode,
          actionCallback: () => {
            this.edit()
          }
        },
        {
          titleKey: 'MCPSERVER_DETAILS.GENERAL.CANCEL',
          labelKey: 'MCPSERVER_DETAILS.GENERAL.CANCEL',
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
          titleKey: 'MCPSERVER_DETAILS.GENERAL.SAVE',
          labelKey: 'MCPSERVER_DETAILS.GENERAL.SAVE',
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
          titleKey: 'MCPSERVER_DETAILS.GENERAL.DELETE',
          labelKey: 'MCPSERVER_DETAILS.GENERAL.DELETE',
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
  readonly authModeOptions = Object.values(AuthMode)
  readonly executionPolicyOptions = Object.values(ExecutionPolicy).filter((policy) => policy !== ExecutionPolicy.Allow)
  readonly serverTypeOptions = [
    { labelKey: 'MCPSERVER_DETAILS.FORM.TYPE_INTERNAL', value: false },
    { labelKey: 'MCPSERVER_DETAILS.FORM.TYPE_EXTERNAL', value: true }
  ]
  hasAPIKeyPermission = false
  applications: ApplicationInfo[] = []
  products: string[] = []
  productSuggestions: string[] = []
  appSuggestions: string[] = []

  constructor(
    private readonly store: Store,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly userService: UserService,
    private readonly applicationService: ApplicationService,
    private readonly destroyRef: DestroyRef
  ) {
    this.formGroup = new FormGroup({
      apiKey: new FormControl(null, [Validators.maxLength(255)]),
      name: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.required, Validators.maxLength(1024)]),
      url: new FormControl(null, [Validators.required, Validators.maxLength(2048)]),
      authMode: new FormControl<AuthMode | null>(null),
      executionPolicy: new FormControl<ExecutionPolicy | null>(null),
      external: new FormControl<boolean>(false, { nonNullable: true }),
      productName: new FormControl<string | null>(null, [Validators.maxLength(255)]),
      appId: new FormControl<string | null>(null, [Validators.maxLength(255)])
    })
    this.formGroup.disable()

    this.formGroup
      .get('external')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((external) => this.onServerTypeChanged(external))

    this.applicationService
      .getApplications()
      .pipe(
        catchError(() => of([] as ApplicationInfo[])),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((applications) => {
        this.applications = applications
        this.products = [...new Set(applications.map((app) => app.productName).filter(Boolean))] as string[]
      })

    this.viewModel$.subscribe((vm) => {
      if (!vm.editMode) {
        this.formGroup.patchValue({
          apiKey: vm.details?.apiKey,
          name: vm.details?.name,
          description: vm.details?.description,
          url: vm.details?.url,
          authMode: vm.details?.authMode,
          executionPolicy: vm.details?.executionPolicy,
          external: vm.details?.external ?? false,
          productName: vm.details?.productName ?? null,
          appId: vm.details?.appId ?? null
        })
        this.onServerTypeChanged(this.formGroup.controls['external'].value)
        this.formGroup.markAsPristine()
      }

      if (vm.editMode) {
        this.formGroup.enable()
      } else {
        this.formGroup.disable()
      }
    })

    this.userService
      .hasPermission('MCPSERVER#CHANGE_API_KEY')
      .then((res) => (this.hasAPIKeyPermission = res))
      .catch((err) => console.error(err))
  }

  ngOnInit(): void {
    this.breadcrumbService.setItems([
      {
        titleKey: 'MCPSERVER_DETAILS.BREADCRUMB',
        labelKey: 'MCPSERVER_DETAILS.BREADCRUMB',
        routerLink: '../'
      }
    ])
  }

  edit() {
    this.store.dispatch(MCPServerDetailsActions.editButtonClicked())
  }

  searchProducts(event: AutoCompleteCompleteEvent) {
    this.productSuggestions = this.matching(this.products, event.query)
  }

  searchApps(event: AutoCompleteCompleteEvent) {
    const productName = this.formGroup.get('productName')?.value
    const appIds = this.applications
      .filter((app) => !productName || app.productName === productName)
      .map((app) => app.appId)
      .filter((appId): appId is string => !!appId)
    this.appSuggestions = this.matching([...new Set(appIds)], event.query)
  }

  private matching(values: string[], query: string): string[] {
    const normalized = (query ?? '').toLowerCase()
    return values.filter((value) => value.toLowerCase().includes(normalized))
  }

  private onServerTypeChanged(external: boolean) {
    const productName = this.formGroup.get('productName')
    const appId = this.formGroup.get('appId')
    if (external) {
      productName?.setValue(null, { emitEvent: false })
      appId?.setValue(null, { emitEvent: false })
      productName?.clearValidators()
      appId?.clearValidators()
    } else {
      productName?.setValidators([Validators.required, Validators.maxLength(255)])
      appId?.setValidators([Validators.required, Validators.maxLength(255)])
    }
    productName?.updateValueAndValidity({ emitEvent: false })
    appId?.updateValueAndValidity({ emitEvent: false })
  }

  cancel() {
    this.store.dispatch(MCPServerDetailsActions.cancelButtonClicked({ dirty: this.formGroup.dirty }))
  }

  save() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched()
      return
    }
    this.store.dispatch(
      MCPServerDetailsActions.saveButtonClicked({
        details: this.formGroup.value
      })
    )
  }

  delete() {
    this.store.dispatch(MCPServerDetailsActions.deleteButtonClicked())
  }

  toggleApiKeyVisibility() {
    this.store.dispatch(MCPServerDetailsActions.apiKeyVisibilityToggled())
  }
}

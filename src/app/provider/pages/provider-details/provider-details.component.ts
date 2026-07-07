import { Component, OnInit } from '@angular/core'
import { Store } from '@ngrx/store'
import { Action, AngularAcceleratorModule, BreadcrumbService } from '@onecx/angular-accelerator'
import { UserService } from '@onecx/angular-integration-interface'
import { map, Observable } from 'rxjs'
import { PrimeIcons } from 'primeng/api'
import { selectProviderDetailsViewModel } from './provider-details.selectors'
import { ProviderDetailsViewModel } from './provider-details.viewmodel'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { ProviderSearchActions } from '../provider-search/provider-search.actions'
import { ProviderDetailsActions } from './provider-details.actions'
import { TranslateModule } from '@ngx-translate/core'
import { CommonModule } from '@angular/common'
import { LetDirective } from '@ngrx/component'
import { PortalPageComponent } from '@onecx/angular-utils'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'
import { FloatLabelModule } from 'primeng/floatlabel'

@Component({
  selector: 'app-provider-details',
  templateUrl: './provider-details.component.html',
  styleUrls: ['./provider-details.component.scss'],
  imports: [
    AngularAcceleratorModule,
    CommonModule,
    TranslateModule,
    FormsModule,
    FloatLabelModule,
    ReactiveFormsModule,
    LetDirective,
    InputTextModule,
    PortalPageComponent,
    TooltipModule
  ]
})
export class ProviderDetailsComponent implements OnInit {
  viewModel$!: Observable<ProviderDetailsViewModel>
  headerActions$!: Observable<Action[]>
  public formGroup: FormGroup

  constructor(
    private readonly store: Store,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly user: UserService
  ) {
    this.formGroup = new FormGroup({
      name: new FormControl(null, [Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.maxLength(255)]),
      llmUrl: new FormControl(null, [Validators.maxLength(255)]),
      modelName: new FormControl(null, [Validators.maxLength(255)]),
      apiKey: new FormControl(null, [Validators.maxLength(255)])
    })
  }

  ngOnInit(): void {
    this.viewModel$ = this.store.select(selectProviderDetailsViewModel)

    this.headerActions$ = this.viewModel$.pipe(
      map((vm) => {
        const actions: Action[] = [
          {
            titleKey: 'PROVIDER_DETAILS.GENERAL.BACK',
            labelKey: 'PROVIDER_DETAILS.GENERAL.BACK',
            show: 'always',
            icon: PrimeIcons.ARROW_LEFT,
            conditional: true,
            showCondition: !vm.editMode,
            actionCallback: () => {
              globalThis.history.back()
            }
          },
          {
            titleKey: 'PROVIDER_DETAILS.GENERAL.EDIT',
            labelKey: 'PROVIDER_DETAILS.GENERAL.EDIT',
            show: 'always',
            icon: PrimeIcons.PENCIL,
            conditional: true,
            showCondition: !vm.editMode,
            actionCallback: () => {
              this.toggleEditMode(true)
            }
          },
          {
            titleKey: 'PROVIDER_DETAILS.GENERAL.DELETE',
            labelKey: 'PROVIDER_DETAILS.GENERAL.DELETE',
            icon: PrimeIcons.TRASH,
            show: 'asOverflow',
            btnClass: '',
            conditional: true,
            showCondition: !vm.editMode,
            actionCallback: () => {
              this.delete(vm.details?.id ?? '')
            }
          },
          {
            titleKey: 'PROVIDER_DETAILS.GENERAL.CANCEL',
            labelKey: 'PROVIDER_DETAILS.GENERAL.CANCEL',
            show: 'always',
            icon: PrimeIcons.TIMES,
            conditional: true,
            showCondition: vm.editMode,
            actionCallback: () => {
              this.toggleEditMode(false)
            }
          },
          {
            titleKey: 'PROVIDER_DETAILS.GENERAL.SAVE',
            labelKey: 'PROVIDER_DETAILS.GENERAL.SAVE',
            show: 'always',
            icon: PrimeIcons.SAVE,
            conditional: true,
            showCondition: vm.editMode,
            actionCallback: () => {
              this.edit(vm.details?.id ?? '')
              this.toggleEditMode(false)
            }
          }
        ]
        return actions
      })
    )

    this.viewModel$.subscribe((Provider) => {
      this.formGroup.patchValue({
        name: Provider.details?.name ?? '',
        description: Provider.details?.description,
        llmUrl: Provider.details?.llmUrl,
        type: Provider.details?.type,
        apiKey: Provider.details?.apiKey
      })
    })
    this.formGroup.disable()

    this.breadcrumbService.setItems([
      {
        titleKey: 'PROVIDER_DETAILS.BREADCRUMB',
        labelKey: 'PROVIDER_DETAILS.BREADCRUMB',
        routerLink: '/provider'
      }
    ])
  }

  edit(id: string) {
    this.store.dispatch(ProviderSearchActions.editProviderDetailsButtonClicked({ id }))
  }

  delete(id: string) {
    this.store.dispatch(ProviderSearchActions.deleteProviderButtonClicked({ id }))
  }

  toggleEditMode(value: boolean) {
    this.store.dispatch(ProviderDetailsActions.providerDetailsEditModeSet({ editMode: value }))
    if (value) {
      this.formGroup.enable()
    } else {
      this.formGroup.disable()
    }
    if (!this.user.hasPermission('PROVIDER#CHANGE_API_KEY')) {
      this.formGroup.get('apiKey')?.disable()
    }
  }

  toggleApiKeyVisibility() {
    this.store.dispatch(ProviderDetailsActions.apiKeyVisibilityToggled())
  }
}

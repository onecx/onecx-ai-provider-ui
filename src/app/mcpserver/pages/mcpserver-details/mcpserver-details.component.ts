import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { TranslateModule, TranslatePipe } from '@ngx-translate/core'
import { map, Observable } from 'rxjs'
import { PrimeIcons } from 'primeng/api'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { PasswordModule } from 'primeng/password'

import { Action, AngularAcceleratorModule, BreadcrumbService, ObjectDetailItem } from '@onecx/angular-accelerator'
import { PortalPageComponent } from '@onecx/angular-utils'
import { UserService } from '@onecx/angular-integration-interface'

import { MCPServerDetailsActions } from './mcpserver-details.actions'
import { selectMCPServerDetailsViewModel } from './mcpserver-details.selectors'
import { MCPServerDetailsViewModel } from './mcpserver-details.viewmodel'

@Component({
  selector: 'app-mcpserver-details',
  imports: [
    AngularAcceleratorModule,
    CommonModule,
    LetDirective,
    FloatLabelModule,
    InputTextModule,
    PasswordModule,
    TranslateModule,
    ReactiveFormsModule,
    PortalPageComponent
  ],
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
          disabled: !vm.backNavigationPossible,
          permission: 'MCPSERVER#BACK',
          showCondition: !vm.editMode,
          actionCallback: () => {
            this.store.dispatch(MCPServerDetailsActions.navigateBackButtonClicked())
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
  hasAPIKeyPermission = false

  constructor(
    private readonly store: Store,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly userService: UserService
  ) {
    this.formGroup = new FormGroup({
      apiKey: new FormControl(null, [Validators.maxLength(255)]),
      name: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.required, Validators.maxLength(1024)]),
      url: new FormControl(null, [Validators.required, Validators.maxLength(2048)])
    })
    this.formGroup.disable()

    this.viewModel$.subscribe((vm) => {
      if (!vm.editMode) {
        this.formGroup.patchValue({
          apiKey: vm.details?.apiKey,
          name: vm.details?.name,
          description: vm.details?.description,
          url: vm.details?.url
        })
        this.formGroup.markAsPristine()
      }

      if (vm.editMode) {
        this.formGroup.enable()
      } else {
        this.formGroup.disable()
      }
    })

    this.userService.hasPermission('MCPSERVER#CHANGE_API_KEY').then((res) => (this.hasAPIKeyPermission = res))
  }

  ngOnInit(): void {
    this.breadcrumbService.setItems([
      {
        titleKey: 'MCPSERVER_DETAILS.BREADCRUMB',
        labelKey: 'MCPSERVER_DETAILS.BREADCRUMB',
        routerLink: '/mcpserver'
      }
    ])
  }

  edit() {
    this.store.dispatch(MCPServerDetailsActions.editButtonClicked())
  }

  cancel() {
    this.store.dispatch(MCPServerDetailsActions.cancelButtonClicked({ dirty: this.formGroup.dirty }))
  }

  save() {
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

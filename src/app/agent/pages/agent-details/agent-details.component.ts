import { Component, OnInit, inject } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { Store } from '@ngrx/store'
import { TranslatePipe } from '@ngx-translate/core'
import { PrimeIcons } from 'primeng/api'
import { Observable, map } from 'rxjs'

import { Action, BreadcrumbService, ObjectDetailItem } from '@onecx/angular-accelerator'

import { Agent } from 'src/app/shared/generated'
import { agentDetailsActions } from './agent-details.actions'
import { selectAgentDetailsViewModel } from './agent-details.selectors'
import { AgentDetailsViewModel } from './agent-details.viewmodel'

@Component({
  selector: 'app-agent-details',
  templateUrl: './agent-details.component.html',
  styleUrls: ['./agent-details.component.scss'],
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class AgentDetailsComponent implements OnInit {
  private readonly store = inject(Store)
  private readonly breadcrumbService = inject(BreadcrumbService)

  viewModel$: Observable<AgentDetailsViewModel> = this.store.select(selectAgentDetailsViewModel)
  objectDetails$: Observable<ObjectDetailItem[]> = this.viewModel$.pipe(
    map((vm) => {
      const labels: ObjectDetailItem[] = [
        {
          label: 'AGENT_DETAILS.FORM.NAME',
          labelPipe: TranslatePipe,
          value: vm.details?.name
        },
        {
          label: 'AGENT_DETAILS.FORM.STATUS',
          labelPipe: TranslatePipe,
          value: vm.details?.status
        }
      ]
      return labels
    })
  )

  headerActions$: Observable<Action[]> = this.viewModel$.pipe(
    map((vm) => {
      const actions: Action[] = [
        {
          titleKey: 'AGENT_DETAILS.GENERAL.BACK',
          labelKey: 'AGENT_DETAILS.GENERAL.BACK',
          show: 'always',
          disabled: !vm.backNavigationPossible,
          showCondition: !vm.editMode,
          actionCallback: () => {
            this.store.dispatch(agentDetailsActions.navigateBackButtonClicked())
          }
        },
        {
          titleKey: 'AGENT_DETAILS.GENERAL.EDIT',
          labelKey: 'AGENT_DETAILS.GENERAL.EDIT',
          permission: 'AGENT#EDIT',
          show: 'always',
          icon: PrimeIcons.PENCIL,
          conditional: true,
          showCondition: !vm.editMode,
          actionCallback: () => {
            this.edit()
          }
        },
        {
          titleKey: 'AGENT_DETAILS.GENERAL.CANCEL',
          labelKey: 'AGENT_DETAILS.GENERAL.CANCEL',
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
          titleKey: 'AGENT_DETAILS.GENERAL.SAVE',
          labelKey: 'AGENT_DETAILS.GENERAL.SAVE',
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
          titleKey: 'AGENT_DETAILS.GENERAL.DELETE',
          labelKey: 'AGENT_DETAILS.GENERAL.DELETE',
          permission: 'AGENT#DELETE',
          icon: PrimeIcons.TRASH,
          show: 'always',
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
  private currentDetails: Agent | undefined

  constructor() {
    this.formGroup = new FormGroup({
      tenantId: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      name: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      modelId: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      scaffoldId: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      runtimeConfigId: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      additionalPrompt: new FormControl(null, [Validators.maxLength(4000)]),
      a2aEnabled: new FormControl(false),
      version: new FormControl(null, [Validators.required, Validators.min(0)]),
      status: new FormControl(null, [Validators.required, Validators.maxLength(32)])
    })
    this.formGroup.disable()

    this.viewModel$.subscribe((vm) => {
      this.currentDetails = vm.details
      if (!vm.editMode) {
        this.formGroup.patchValue({
          name: vm.details?.name,
          modelId: vm.details?.model?.id,
          scaffoldId: vm.details?.scaffold?.id,
          additionalPrompt: vm.details?.additionalPrompt,
          a2aEnabled: vm.details?.a2aEnabled,
          status: vm.details?.status
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
        titleKey: 'AGENT_DETAILS.BREADCRUMB',
        labelKey: 'AGENT_DETAILS.BREADCRUMB',
        routerLink: '/agent'
      }
    ])
  }

  edit() {
    this.store.dispatch(agentDetailsActions.editButtonClicked())
  }

  cancel() {
    this.store.dispatch(agentDetailsActions.cancelButtonClicked({ dirty: this.formGroup.dirty }))
  }

  save() {
    this.store.dispatch(
      agentDetailsActions.saveButtonClicked({
        details: { ...this.currentDetails, ...this.formGroup.value }
      })
    )
  }

  delete() {
    this.store.dispatch(agentDetailsActions.deleteButtonClicked())
  }
}

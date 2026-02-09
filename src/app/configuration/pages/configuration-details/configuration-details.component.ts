import { Component, OnInit } from '@angular/core'
import { Store } from '@ngrx/store'
import { Action, BreadcrumbService, ObjectDetailItem } from '@onecx/portal-integration-angular'
import { map, Observable, BehaviorSubject, combineLatest } from 'rxjs'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { PrimeIcons } from 'primeng/api'
import { ConfigurationDetailsActions } from './configuration-details.actions'
import { ConfigurationDetailsViewModel } from './configuration-details.viewmodel'
import { selectConfigurationDetailsViewModel } from './configuration-details.selectors'
import {
  MCPServer,
  Provider
} from 'src/app/shared/generated'

@Component({
  selector: 'app-configuration-details',
  templateUrl: './configuration-details.component.html',
  styleUrls: ['./configuration-details.component.scss']
})
export class ConfigurationDetailsComponent implements OnInit {
  viewModel$: Observable<ConfigurationDetailsViewModel> = this.store.select(selectConfigurationDetailsViewModel)

  headerLabels$: Observable<ObjectDetailItem[]> = this.viewModel$.pipe(
    map(() => {
      const labels: ObjectDetailItem[] = []
      return labels
    })
  )

  headerActions$: Observable<Action[]> = this.viewModel$.pipe(
    map((vm) => {
      const actions: Action[] = [
        {
          titleKey: 'CONFIGURATION_DETAILS.GENERAL.BACK',
          labelKey: 'CONFIGURATION_DETAILS.GENERAL.BACK',
          show: 'always',
          disabled: !vm.backNavigationPossible,
          icon: PrimeIcons.ARROW_LEFT,
          conditional: true,
          showCondition: !vm.editMode,
          actionCallback: () => {
            this.goBack()
          }
        },
        {
          titleKey: 'CONFIGURATION_DETAILS.GENERAL.EDIT',
          labelKey: 'CONFIGURATION_DETAILS.GENERAL.EDIT',
          show: 'always',
          icon: PrimeIcons.PENCIL,
          conditional: true,
          showCondition: !vm.editMode,
          actionCallback: () => {
            this.edit()
          }
        },
        {
          titleKey: 'CONFIGURATION_DETAILS.GENERAL.CANCEL',
          labelKey: 'CONFIGURATION_DETAILS.GENERAL.CANCEL',
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
          titleKey: 'CONFIGURATION_DETAILS.GENERAL.SAVE',
          labelKey: 'CONFIGURATION_DETAILS.GENERAL.SAVE',
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
          titleKey: 'CONFIGURATION_DETAILS.GENERAL.DELETE',
          labelKey: 'CONFIGURATION_DETAILS.GENERAL.DELETE',
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

  providerQuery$: BehaviorSubject<string> = new BehaviorSubject<string>('')
  filteredProviders$: Observable<Provider[]>

  mcpServerQuery$: BehaviorSubject<string> = new BehaviorSubject<string>('')
  filteredMCPServers$: Observable<MCPServer[]>

  constructor(
    private readonly store: Store,
    private readonly breadcrumbService: BreadcrumbService
  ) {
    this.filteredProviders$ = combineLatest([this.providerQuery$, this.viewModel$]).pipe(
      map(([query, vm]) => {
        const suggestions = [...(vm.details?.llmProvider ? [vm.details.llmProvider] : []), ...vm.Providers ?? []]
        return suggestions.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase())
          && vm.details?.llmProvider?.id !== p.id)
      })
    )

    this.mcpServerQuery$ = new BehaviorSubject<string>('')
    this.filteredMCPServers$ = combineLatest([
      this.mcpServerQuery$,
      this.viewModel$
    ]).pipe(
      map(([query, vm]) => {
        const suggestions = [...(vm.details?.mcpServers ?? []), ...vm.MCPServers ?? []]
        return suggestions.filter((mcp) =>
          (mcp.name ?? '').toLowerCase().includes(query.toLowerCase())
          && vm.details?.mcpServers?.every(selected => selected.id !== mcp.id)
        )
      })
    )

    this.formGroup = new FormGroup({
      id: new FormControl('', [Validators.maxLength(255)]),      
      name: new FormControl('', [Validators.required]),
      description: new FormControl(''),
      mcpServers: new FormControl(undefined),
      llmProvider: new FormControl(undefined),
    })
    this.formGroup.disable()

    this.viewModel$.subscribe((vm) => {
      if (!vm.editMode) {
        this.formGroup.patchValue({
          id: vm.details?.id || '',
          name: vm.details?.name || '',
          description: vm.details?.description || '',
          mcpServers: vm.details?.mcpServers,
          llmProvider: vm.details?.llmProvider,
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
        titleKey: 'CONFIGURATION_DETAILS.BREADCRUMB',
        labelKey: 'CONFIGURATION_DETAILS.BREADCRUMB',
        routerLink: '/configuration'
      }
    ])
  }

  getMCPName(mcpServer: MCPServer): string {
    return mcpServer ? `${mcpServer.name}` : ''
  }

  searchMCPServers(event: { query: string }) {
    this.mcpServerQuery$.next(event.query)
  }

  searchProviders(event: { query: string }) {
    this.providerQuery$.next(event.query)
  }

  edit() {
    this.store.dispatch(ConfigurationDetailsActions.editButtonClicked())
  }

  cancel() {
    this.store.dispatch(ConfigurationDetailsActions.cancelButtonClicked({ dirty: this.formGroup.dirty }))
  }

  save() {
    const formValue = this.formGroup.value

    const payload = {
      ...formValue
    }

    this.store.dispatch(
      ConfigurationDetailsActions.saveButtonClicked({
        details: payload
      })
    )
  }

  delete() {
    this.store.dispatch(ConfigurationDetailsActions.deleteButtonClicked())
  }

  goBack() {
    this.store.dispatch(ConfigurationDetailsActions.navigateBackButtonClicked())
  }
}

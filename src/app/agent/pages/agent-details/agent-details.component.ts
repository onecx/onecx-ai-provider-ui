import { DatePipe } from '@angular/common'
import { Component, OnInit, inject } from '@angular/core'
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms'
import { Store } from '@ngrx/store'
import { TranslatePipe } from '@ngx-translate/core'
import { PrimeIcons } from 'primeng/api'
import { Observable, map } from 'rxjs'

import { Action, BreadcrumbService, ObjectDetailItem } from '@onecx/angular-accelerator'

import { Agent, AgentFilter, AgentFilterKeyEnum, AgentGroup, Model, Provider, Scaffold, Tool } from 'src/app/shared/generated'
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
  readonly filterKeys = Object.values(AgentFilterKeyEnum)
  filterKeySuggestions: string[] = [...this.filterKeys]

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
        },
        {
          label: 'AGENT_DETAILS.FORM.VERSION',
          labelPipe: TranslatePipe,
          value: vm.details?.modificationCount?.toString()
        },
        {
          label: 'AGENT_DETAILS.FORM.LAST_CHANGED',
          labelPipe: TranslatePipe,
          value: vm.details?.modificationDate,
          valuePipe: DatePipe,
          valuePipeArgs: 'medium'
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
      name: new FormControl(null, [Validators.required, Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.maxLength(4000)]),
      additionalPrompt: new FormControl(null, [Validators.maxLength(4000)]),
      provider: new FormControl<Provider | null>(null),
      model: new FormControl<Model | null>(null),
      scaffold: new FormControl<Scaffold | null>(null),
      tools: new FormControl<Tool[]>([]),
      groups: new FormControl<AgentGroup[]>([]),
      newGroupName: new FormControl<string | null>(null, [Validators.maxLength(255)]),
      filters: new FormArray([])
    })
    this.formGroup.disable()

    this.viewModel$.subscribe((vm) => {
      this.currentDetails = vm.details
      if (!vm.editMode) {
        this.formGroup.patchValue({
          name: vm.details?.name,
          description: vm.details?.description,
          additionalPrompt: vm.details?.additionalPrompt,
          provider: vm.details?.model?.provider ?? null,
          model: vm.details?.model ?? null,
          scaffold: vm.details?.scaffold ?? null,
          tools: vm.details?.tools ?? [],
          groups: vm.details?.groups ?? [],
          newGroupName: null
        })
        this.setFilters(vm.details?.filter ? [vm.details.filter] : [])
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
    const selectedFilter = this.filtersFormArray.controls
      .map((entry) => {
        const key = entry.get('key')?.value as AgentFilterKeyEnum | null
        const value = entry.get('value')?.value as string | null
        if (!key || !value) {
          return undefined
        }
        return { key, value } as AgentFilter
      })
      .find((entry): entry is AgentFilter => entry !== undefined)

    const selectedProvider = this.formGroup.get('provider')?.value as Provider | null
    const selectedModel = this.formGroup.get('model')?.value as Model | null

    const details: Agent = {
      ...this.currentDetails,
      name: this.formGroup.get('name')?.value,
      description: this.formGroup.get('description')?.value,
      additionalPrompt: this.formGroup.get('additionalPrompt')?.value,
      model: selectedModel ? { ...selectedModel, provider: selectedProvider ?? selectedModel.provider } : undefined,
      scaffold: (this.formGroup.get('scaffold')?.value as Scaffold | null) ?? undefined,
      tools: (this.formGroup.get('tools')?.value as Tool[]) ?? [],
      groups: (this.formGroup.get('groups')?.value as AgentGroup[]) ?? [],
      filter: selectedFilter
    }

    this.store.dispatch(
      agentDetailsActions.saveButtonClicked({
        details
      })
    )
  }

  delete() {
    this.store.dispatch(agentDetailsActions.deleteButtonClicked())
  }

  get filtersFormArray(): FormArray {
    return this.formGroup.get('filters') as FormArray
  }

  addFilter() {
    this.filtersFormArray.push(this.createFilterFormGroup())
  }

  removeFilter(index: number) {
    this.filtersFormArray.removeAt(index)
  }

  searchFilterKeys(event: { query: string }) {
    const query = event.query.trim().toUpperCase()
    this.filterKeySuggestions = query
      ? this.filterKeys.filter((key) => key.toUpperCase().includes(query))
      : [...this.filterKeys]
  }

  onProviderChanged() {
    const selectedProvider = this.formGroup.get('provider')?.value as Provider | null
    const selectedModel = this.formGroup.get('model')?.value as Model | null
    if (selectedProvider && selectedModel && selectedModel.provider?.id !== selectedProvider.id) {
      this.formGroup.get('model')?.setValue(null)
    }
  }

  createGroupInPlace() {
    const groupName = this.formGroup.get('newGroupName')?.value?.trim()
    if (!groupName) {
      return
    }
    this.store.dispatch(agentDetailsActions.createGroupInPlaceClicked({ name: groupName }))
    this.formGroup.get('newGroupName')?.setValue(null)
  }

  getFilteredModels(allModels: Model[]): Model[] {
    const selectedProvider = this.formGroup.get('provider')?.value as Provider | null
    if (!selectedProvider?.id) {
      return allModels
    }
    return allModels.filter((model) => model.provider?.id === selectedProvider.id)
  }

  private createFilterFormGroup(filter?: AgentFilter): FormGroup {
    return new FormGroup({
      key: new FormControl<AgentFilterKeyEnum | null>(filter?.key ?? null, [Validators.required]),
      value: new FormControl<string | null>(filter?.value ?? null, [Validators.required, Validators.maxLength(255)])
    })
  }

  private setFilters(filters: AgentFilter[]) {
    this.filtersFormArray.clear()
    for (const filter of filters) {
      this.filtersFormArray.push(this.createFilterFormGroup(filter))
    }
  }
}

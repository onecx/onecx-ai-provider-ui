import { Component, inject, LOCALE_ID, OnInit, QueryList, ViewChildren } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { Store } from '@ngrx/store'
import { PrimeIcons } from 'primeng/api'
import { DatePicker } from 'primeng/datepicker'
import { map, Observable } from 'rxjs'

import {
  Action,
  BreadcrumbService,
  buildSearchCriteria,
  DataSortDirection,
  DataTableColumn,
  DiagramComponentState,
  DiagramType,
  ExportDataService,
  InteractiveDataViewComponentState,
  RowListGridData,
  SearchHeaderComponentState
} from '@onecx/angular-accelerator'

import { agentSearchActions } from './agent-search.actions'
import { AgentSearchCriteria, agentSearchCriteriasSchema } from './agent-search.parameters'
import { selectAgentSearchViewModel } from './agent-search.selectors'
import { AgentSearchViewModel } from './agent-search.viewmodel'

@Component({
  selector: 'app-agent-search',
  templateUrl: './agent-search.component.html',
  styleUrls: ['./agent-search.component.scss'],
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class AgentSearchComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService)
  private readonly store = inject(Store)
  private readonly formBuilder = inject(FormBuilder)
  readonly locale = inject(LOCALE_ID)
  private readonly exportDataService = inject(ExportDataService)

  @ViewChildren(DatePicker) calendars!: QueryList<DatePicker>
  viewModel$: Observable<AgentSearchViewModel> = this.store.select(selectAgentSearchViewModel)

  // ACTION S10: Update header actions
  headerActions$: Observable<Action[]> = this.viewModel$.pipe(
    map((vm) => {
      const actions: Action[] = [
        {
          labelKey: 'AGENT_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          icon: PrimeIcons.DOWNLOAD,
          titleKey: 'AGENT_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          show: 'asOverflow',
          actionCallback: () => this.exportItems()
        },
        {
          labelKey: vm.chartVisible
            ? 'AGENT_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'AGENT_SEARCH.HEADER_ACTIONS.SHOW_CHART',
          icon: PrimeIcons.EYE,
          titleKey: vm.chartVisible
            ? 'AGENT_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'AGENT_SEARCH.HEADER_ACTIONS.SHOW_CHART',
          show: 'asOverflow',
          actionCallback: () => this.toggleChartVisibility()
        }
      ]
      return actions
    })
  )

  defaultDataSortDirection = DataSortDirection.NONE
  defaultDiagramType = DiagramType.PIE

  // ACTION S9: Select the column to be displayed in the diagram
  diagramColumnId = 'status'
  diagramColumn$: Observable<DataTableColumn> = this.viewModel$.pipe(
    map((vm) => vm.columns.find((e) => e.id === this.diagramColumnId) as DataTableColumn)
  )

  public agentSearchFormGroup: FormGroup = this.formBuilder.group({
    ...(Object.fromEntries(agentSearchCriteriasSchema.keyof().options.map((k) => [k, null])) as Record<
      keyof AgentSearchCriteria,
      unknown
    >)
  } satisfies Record<keyof AgentSearchCriteria, unknown>)

  ngOnInit() {
    this.breadcrumbService.setItems([
      {
        titleKey: 'AGENT_SEARCH.BREADCRUMB',
        labelKey: 'AGENT_SEARCH.BREADCRUMB',
        routerLink: '/agent'
      }
    ])
    this.viewModel$.subscribe((vm) => this.agentSearchFormGroup.patchValue(vm.searchCriteria))
  }

  resultComponentStateChanged(state: InteractiveDataViewComponentState) {
    this.store.dispatch(agentSearchActions.resultComponentStateChanged(state))
  }

  searchHeaderComponentStateChanged(state: SearchHeaderComponentState) {
    this.store.dispatch(agentSearchActions.searchHeaderComponentStateChanged(state))
  }

  diagramComponentStateChanged(state: DiagramComponentState) {
    this.store.dispatch(agentSearchActions.diagramComponentStateChanged(state))
  }

  search(formValue: FormGroup) {
    const searchCriteria = buildSearchCriteria(formValue.getRawValue(), this.calendars, { removeNullValues: true })
    this.store.dispatch(agentSearchActions.searchButtonClicked({ searchCriteria }))
  }

  details({ id }: RowListGridData) {
    this.store.dispatch(agentSearchActions.detailsButtonClicked({ id }))
  }

  resetSearch() {
    this.store.dispatch(agentSearchActions.resetButtonClicked())
  }

  exportItems() {
    this.store.dispatch(agentSearchActions.exportButtonClicked())
  }

  toggleChartVisibility() {
    this.store.dispatch(agentSearchActions.chartVisibilityToggled())
  }
}

import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { Store } from '@ngrx/store'
import { getUTCDateWithoutTimezoneIssues, isValidDate } from '@onecx/accelerator'
import {
  Action,
  BreadcrumbService,
  DataSortDirection,
  DataTableColumn,
  DiagramComponentState,
  DiagramType,
  ExportDataService,
  InteractiveDataViewComponentState,
  RowListGridData,
  SearchHeaderComponentState
} from '@onecx/portal-integration-angular'
import { PrimeIcons } from 'primeng/api'
import { map, Observable } from 'rxjs'
import { MCPServerSearchActions } from './mcpserver-search.actions'
import { MCPServerSearchCriteria, mcpserverSearchCriteriasSchema } from './mcpserver-search.parameters'
import { selectMCPServerSearchViewModel } from './mcpserver-search.selectors'
import { MCPServerSearchViewModel } from './mcpserver-search.viewmodel'

@Component({
  selector: 'app-mcpserver-search',
  templateUrl: './mcpserver-search.component.html',
  styleUrls: ['./mcpserver-search.component.scss']
})
export class MCPServerSearchComponent implements OnInit {
  viewModel$: Observable<MCPServerSearchViewModel> = this.store.select(selectMCPServerSearchViewModel)

  defaultDataSortDirection = DataSortDirection.NONE
  defaultDiagramType = DiagramType.PIE

  // ACTION S10: Update header actions: https://onecx.github.io/docs/nx-plugins/current/general/getting_started/search/update-header-actions.html#action-10
  headerActions$: Observable<Action[]> = this.viewModel$.pipe(
    map((vm) => {
      const actions: Action[] = [
        {
          labelKey: 'MCPSERVER_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          icon: PrimeIcons.DOWNLOAD,
          titleKey: 'MCPSERVER_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          show: 'asOverflow',
          actionCallback: () => this.exportItems()
        },
        {
          labelKey: vm.chartVisible
            ? 'MCPSERVER_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'MCPSERVER_SEARCH.HEADER_ACTIONS.SHOW_CHART',
          icon: PrimeIcons.EYE,
          titleKey: vm.chartVisible
            ? 'MCPSERVER_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'MCPSERVER_SEARCH.HEADER_ACTIONS.SHOW_CHART',
          show: 'asOverflow',
          actionCallback: () => this.toggleChartVisibility()
        }
      ]
      return actions
    })
  )

  // ACTION S9: Select the column to be displayed in the diagram: https://onecx.github.io/docs/nx-plugins/current/general/getting_started/search/configure-result-diagram.html#action-3
  diagramColumnId = 'id'
  diagramColumn$ = this.viewModel$.pipe(
    map((vm) => vm.columns.find((e) => e.id === this.diagramColumnId) as DataTableColumn)
  )

  public mcpserverSearchFormGroup: FormGroup = this.formBuilder.group({
    ...(Object.fromEntries(mcpserverSearchCriteriasSchema.keyof().options.map((k) => [k, null])) as Record<
      keyof MCPServerSearchCriteria,
      unknown
    >)
  } satisfies Record<keyof MCPServerSearchCriteria, unknown>)

  constructor(
    private readonly breadcrumbService: BreadcrumbService,
    private readonly store: Store,
    private readonly formBuilder: FormBuilder,
    @Inject(LOCALE_ID) public readonly locale: string,
    private readonly exportDataService: ExportDataService
  ) { }

  ngOnInit() {
    this.breadcrumbService.setItems([
      {
        titleKey: 'MCPSERVER_SEARCH.BREADCRUMB',
        labelKey: 'MCPSERVER_SEARCH.BREADCRUMB',
        routerLink: '/mcpserver'
      }
    ])
    this.viewModel$.subscribe((vm) => {
      if (Object.keys(vm.searchCriteria).length === 0) {
        this.mcpserverSearchFormGroup.reset()
      } else {
        this.mcpserverSearchFormGroup.patchValue(vm.searchCriteria)
      }
    })
  }

  resultComponentStateChanged(state: InteractiveDataViewComponentState) {
    this.store.dispatch(MCPServerSearchActions.resultComponentStateChanged(state))
  }

  searchHeaderComponentStateChanged(state: SearchHeaderComponentState) {
    this.store.dispatch(MCPServerSearchActions.searchHeaderComponentStateChanged(state))
  }

  diagramComponentStateChanged(state: DiagramComponentState) {
    this.store.dispatch(MCPServerSearchActions.diagramComponentStateChanged(state))
  }

  search(formValue: FormGroup) {
    const searchCriteria = Object.entries(formValue.getRawValue()).reduce(
      (acc: Partial<MCPServerSearchCriteria>, [key, value]) => ({
        ...acc,
        [key]: isValidDate(value)
          ? getUTCDateWithoutTimezoneIssues(value)
          : value
      }),
      {}
    )
    this.store.dispatch(MCPServerSearchActions.searchButtonClicked({ searchCriteria }))
  }

  details({ id }: RowListGridData) {
    this.store.dispatch(MCPServerSearchActions.detailsButtonClicked({ id }))
  }

  resetSearch() {
    this.store.dispatch(MCPServerSearchActions.resetButtonClicked())
  }

  exportItems() {
    this.store.dispatch(MCPServerSearchActions.exportButtonClicked())
  }

  toggleChartVisibility() {
    this.store.dispatch(MCPServerSearchActions.chartVisibilityToggled())
  }
}

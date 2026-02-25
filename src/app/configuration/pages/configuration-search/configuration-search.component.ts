import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { Store } from '@ngrx/store'
import { isValidDate } from '@onecx/accelerator'
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
import { ConfigurationSearchActions } from './configuration-search.actions'
import { ConfigurationSearchCriteria, configurationSearchCriteriasSchema } from './configuration-search.parameters'
import { selectConfigurationSearchViewModel } from './configuration-search.selectors'
import { ConfigurationSearchViewModel } from './configuration-search.viewmodel'

@Component({
  selector: 'app-configuration-search',
  templateUrl: './configuration-search.component.html',
  styleUrls: ['./configuration-search.component.scss']
})
export class ConfigurationSearchComponent implements OnInit {
  viewModel$: Observable<ConfigurationSearchViewModel> = this.store.select(selectConfigurationSearchViewModel)

  defaultDataSortDirection = DataSortDirection.NONE
  defaultDiagramType = DiagramType.PIE

  headerActions$: Observable<Action[]> = this.viewModel$.pipe(
    map((vm) => {
      const actions: Action[] = [
        {
          labelKey: 'CONFIGURATION_SEARCH.HEADER_ACTIONS.NAVIGATE_TO_PROVIDERS',
          icon: PrimeIcons.ANDROID,
          show: 'always',
          actionCallback: () => this.navigateToProviders()
        },
        {
          labelKey: 'CONFIGURATION_SEARCH.HEADER_ACTIONS.NAVIGATE_TO_MCP_SERVERS',
          icon: PrimeIcons.BOOK,
          show: 'always',
          actionCallback: () => this.navigateToMcpServers()
        },
        {
          labelKey: 'CONFIGURATION_CREATE_UPDATE.ACTION.CREATE',
          icon: PrimeIcons.PLUS,
          show: 'always',
          actionCallback: () => this.create()
        },
        {
          labelKey: 'CONFIGURATION_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          icon: PrimeIcons.DOWNLOAD,
          titleKey: 'CONFIGURATION_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          show: 'asOverflow',
          actionCallback: () => this.exportItems()
        },
        {
          labelKey: vm.chartVisible
            ? 'CONFIGURATION_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'CONFIGURATION_SEARCH.HEADER_ACTIONS.SHOW_CHART',
          icon: PrimeIcons.EYE,
          titleKey: vm.chartVisible
            ? 'CONFIGURATION_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'CONFIGURATION_SEARCH.HEADER_ACTIONS.SHOW_CHART',
          show: 'asOverflow',
          actionCallback: () => this.toggleChartVisibility()
        }
      ]
      return actions
    })
  )

  diagramColumnId = 'id'
  diagramColumn$ = this.viewModel$.pipe(
    map((vm) => vm.columns.find((e) => e.id === this.diagramColumnId) as DataTableColumn)
  )

  public configurationSearchFormGroup: FormGroup = this.formBuilder.group({
    ...(Object.fromEntries(configurationSearchCriteriasSchema.keyof().options.map((k) => [k, null])) as Record<
      keyof ConfigurationSearchCriteria,
      unknown
    >)
  } satisfies Record<keyof ConfigurationSearchCriteria, unknown>)

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
        titleKey: 'CONFIGURATION_SEARCH.BREADCRUMB',
        labelKey: 'CONFIGURATION_SEARCH.BREADCRUMB',
        routerLink: '/configuration'
      }
    ])
    this.viewModel$.subscribe((vm) => this.configurationSearchFormGroup.patchValue(vm.searchCriteria))
  }

  resultComponentStateChanged(state: InteractiveDataViewComponentState) {
    this.store.dispatch(ConfigurationSearchActions.resultComponentStateChanged(state))
  }

  searchHeaderComponentStateChanged(state: SearchHeaderComponentState) {
    this.store.dispatch(ConfigurationSearchActions.searchHeaderComponentStateChanged(state))
  }

  diagramComponentStateChanged(state: DiagramComponentState) {
    this.store.dispatch(ConfigurationSearchActions.diagramComponentStateChanged(state))
  }

  search(formValue: FormGroup) {
    const searchCriteria = Object.entries(formValue.getRawValue()).reduce(
      (acc: Partial<ConfigurationSearchCriteria>, [key, value]) => ({
        ...acc,
        [key]: isValidDate(value)
          ? new Date(
            Date.UTC(
              value.getFullYear(),
              value.getMonth(),
              value.getDate(),
              value.getHours(),
              value.getMinutes(),
              value.getSeconds()
            )
          )
          : value || undefined
      }),
      {}
    )
    this.store.dispatch(ConfigurationSearchActions.searchButtonClicked({ searchCriteria }))
  }

  navigateToProviders() {
    this.store.dispatch(ConfigurationSearchActions.navigateToProvidersButtonClicked())
  }

  navigateToMcpServers() {
    this.store.dispatch(ConfigurationSearchActions.navigateToMCPServersButtonClicked())
  }

  create() {
    this.store.dispatch(ConfigurationSearchActions.createConfigurationButtonClicked())
  }

  edit({ id }: RowListGridData) {
    this.store.dispatch(ConfigurationSearchActions.editConfigurationButtonClicked({ id }))
  }

  delete({ id }: RowListGridData) {
    this.store.dispatch(ConfigurationSearchActions.deleteConfigurationButtonClicked({ id }))
  }

  details({ id }: RowListGridData) {
    this.store.dispatch(ConfigurationSearchActions.detailsButtonClicked({ id }))
  }

  resetSearch() {
    this.store.dispatch(ConfigurationSearchActions.resetButtonClicked())
  }

  exportItems() {
    this.store.dispatch(ConfigurationSearchActions.exportButtonClicked())
  }

  viewModeChanged(viewMode: 'basic' | 'advanced') {
    this.store.dispatch(
      ConfigurationSearchActions.viewModeChanged({
        viewMode: viewMode
      })
    )
  }

  onDisplayedColumnsChange(displayedColumns: DataTableColumn[]) {
    this.store.dispatch(ConfigurationSearchActions.displayedColumnsChanged({ displayedColumns }))
  }

  toggleChartVisibility() {
    this.store.dispatch(ConfigurationSearchActions.chartVisibilityToggled())
  }
}

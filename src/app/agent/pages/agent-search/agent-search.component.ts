import { AsyncPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, LOCALE_ID, OnInit, QueryList, ViewChildren } from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { TranslateModule } from '@ngx-translate/core'
import { PrimeIcons } from 'primeng/api'
import { DatePicker } from 'primeng/datepicker'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'
import { map, Observable } from 'rxjs'

import {
  Action,
  AngularAcceleratorModule,
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
import { PortalPageComponent } from '@onecx/angular-utils'

import { agentSearchActions } from './agent-search.actions'
import { AgentSearchCriteria, agentSearchCriteriasSchema } from './agent-search.parameters'
import { selectAgentSearchViewModel } from './agent-search.selectors'
import { AgentSearchViewModel } from './agent-search.viewmodel'

@Component({
  selector: 'app-agent-search',
  imports: [
    TooltipModule,
    TranslateModule,
    AsyncPipe,
    AngularAcceleratorModule,
    FloatLabelModule,
    ReactiveFormsModule,
    PortalPageComponent,
    LetDirective,
    InputTextModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agent-search.component.html',
  styleUrls: ['./agent-search.component.scss']
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
          labelKey: 'AGENT_CREATE_UPDATE.ACTION.CREATE',
          permission: 'AGENT#CREATE',
          icon: PrimeIcons.PLUS,
          show: 'always',
          actionCallback: () => this.create()
        },
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

  create() {
    this.store.dispatch(agentSearchActions.createAgentButtonClicked())
  }

  edit({ id }: RowListGridData) {
    this.store.dispatch(agentSearchActions.editAgentButtonClicked({ id }))
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

import { AsyncPipe } from '@angular/common'
import { Component, inject, LOCALE_ID, OnInit, QueryList, ViewChildren } from '@angular/core'
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

import { scaffoldSearchActions } from './scaffold-search.actions'
import { ScaffoldSearchCriteria, scaffoldSearchCriteriasSchema } from './scaffold-search.parameters'
import { selectScaffoldSearchViewModel } from './scaffold-search.selectors'
import { ScaffoldSearchViewModel } from './scaffold-search.viewmodel'

@Component({
  selector: 'app-scaffold-search',
  imports: [
    TranslateModule,
    AsyncPipe,
    ReactiveFormsModule,
    AngularAcceleratorModule,
    FloatLabelModule,
    TooltipModule,
    PortalPageComponent,
    LetDirective,
    InputTextModule
  ],
  templateUrl: './scaffold-search.component.html',
  styleUrls: ['./scaffold-search.component.scss']
})
export class ScaffoldSearchComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService)
  private readonly store = inject(Store)
  private readonly formBuilder = inject(FormBuilder)
  readonly locale = inject(LOCALE_ID)
  private readonly exportDataService = inject(ExportDataService)

  @ViewChildren(DatePicker) calendars!: QueryList<DatePicker>
  viewModel$: Observable<ScaffoldSearchViewModel> = this.store.select(selectScaffoldSearchViewModel)

  // ACTION S10: Update header actions
  headerActions$: Observable<Action[]> = this.viewModel$.pipe(
    map((vm) => {
      const actions: Action[] = [
        {
          labelKey: 'SCAFFOLD_CREATE_UPDATE.ACTION.CREATE',
          icon: PrimeIcons.PLUS,
          show: 'always',
          actionCallback: () => this.create()
        },
        {
          labelKey: 'SCAFFOLD_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          icon: PrimeIcons.DOWNLOAD,
          titleKey: 'SCAFFOLD_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          show: 'asOverflow',
          actionCallback: () => this.exportItems()
        },
        {
          labelKey: vm.chartVisible
            ? 'SCAFFOLD_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'SCAFFOLD_SEARCH.HEADER_ACTIONS.SHOW_CHART',
          icon: PrimeIcons.EYE,
          titleKey: vm.chartVisible
            ? 'SCAFFOLD_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'SCAFFOLD_SEARCH.HEADER_ACTIONS.SHOW_CHART',
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
  diagramColumnId = 'source'
  diagramColumn$: Observable<DataTableColumn> = this.viewModel$.pipe(
    map((vm) => vm.columns.find((e) => e.id === this.diagramColumnId) as DataTableColumn)
  )

  public scaffoldSearchFormGroup: FormGroup = this.formBuilder.group({
    ...(Object.fromEntries(scaffoldSearchCriteriasSchema.keyof().options.map((k) => [k, null])) as Record<
      keyof ScaffoldSearchCriteria,
      unknown
    >)
  } satisfies Record<keyof ScaffoldSearchCriteria, unknown>)

  ngOnInit() {
    this.breadcrumbService.setItems([
      {
        titleKey: 'SCAFFOLD_SEARCH.BREADCRUMB',
        labelKey: 'SCAFFOLD_SEARCH.BREADCRUMB',
        routerLink: '/scaffold'
      }
    ])
    this.viewModel$.subscribe((vm) => this.scaffoldSearchFormGroup.patchValue(vm.searchCriteria))
    this.store.dispatch(scaffoldSearchActions.loadSkills())
  }

  resultComponentStateChanged(state: InteractiveDataViewComponentState) {
    this.store.dispatch(scaffoldSearchActions.resultComponentStateChanged(state))
  }

  searchHeaderComponentStateChanged(state: SearchHeaderComponentState) {
    this.store.dispatch(scaffoldSearchActions.searchHeaderComponentStateChanged(state))
  }

  diagramComponentStateChanged(state: DiagramComponentState) {
    this.store.dispatch(scaffoldSearchActions.diagramComponentStateChanged(state))
  }

  search(formValue: FormGroup) {
    const searchCriteria = buildSearchCriteria(formValue.getRawValue(), this.calendars, { removeNullValues: true })
    this.store.dispatch(scaffoldSearchActions.searchButtonClicked({ searchCriteria }))
  }

  details({ id }: RowListGridData) {
    this.store.dispatch(scaffoldSearchActions.detailsButtonClicked({ id }))
  }

  create() {
    this.store.dispatch(scaffoldSearchActions.createScaffoldButtonClicked())
  }

  edit({ id }: RowListGridData) {
    this.store.dispatch(scaffoldSearchActions.editScaffoldButtonClicked({ id }))
  }

  resetSearch() {
    this.store.dispatch(scaffoldSearchActions.resetButtonClicked())
  }

  exportItems() {
    this.store.dispatch(scaffoldSearchActions.exportButtonClicked())
  }

  toggleChartVisibility() {
    this.store.dispatch(scaffoldSearchActions.chartVisibilityToggled())
  }
}

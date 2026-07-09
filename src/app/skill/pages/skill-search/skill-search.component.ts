import { Component, inject, LOCALE_ID, OnInit, QueryList, ViewChildren } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { LetDirective } from '@ngrx/component'
import { TranslateModule } from '@ngx-translate/core'
import { PortalPageComponent } from '@onecx/angular-utils'
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

import { skillSearchActions } from './skill-search.actions'
import { SkillSearchCriteria, skillSearchCriteriasSchema } from './skill-search.parameters'
import { selectSkillSearchViewModel } from './skill-search.selectors'
import { SkillSearchViewModel } from './skill-search.viewmodel'

@Component({
  selector: 'app-skill-search',
  templateUrl: './skill-search.component.html',
  styleUrls: ['./skill-search.component.scss'],
  imports: [
    AngularAcceleratorModule,
    TranslateModule,
    CommonModule,
    FormsModule,
    FloatLabelModule,
    ReactiveFormsModule,
    LetDirective,
    InputTextModule,
    TooltipModule,
    PortalPageComponent
  ]
})
export class SkillSearchComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService)
  private readonly store = inject(Store)
  private readonly formBuilder = inject(FormBuilder)
  readonly locale = inject(LOCALE_ID)
  private readonly exportDataService = inject(ExportDataService)

  @ViewChildren(DatePicker) calendars!: QueryList<DatePicker>
  viewModel$: Observable<SkillSearchViewModel> = this.store.select(selectSkillSearchViewModel)

  // ACTION S10: Update header actions
  headerActions$: Observable<Action[]> = this.viewModel$.pipe(
    map((vm) => {
      const actions: Action[] = [
        {
          labelKey: 'SKILL_CREATE_UPDATE.ACTION.CREATE',
          icon: PrimeIcons.PLUS,
          show: 'always',
          actionCallback: () => this.create()
        },
        {
          labelKey: 'SKILL_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          icon: PrimeIcons.DOWNLOAD,
          titleKey: 'SKILL_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          show: 'asOverflow',
          actionCallback: () => this.exportItems()
        },
        {
          labelKey: vm.chartVisible
            ? 'SKILL_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'SKILL_SEARCH.HEADER_ACTIONS.SHOW_CHART',
          icon: PrimeIcons.EYE,
          titleKey: vm.chartVisible
            ? 'SKILL_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'SKILL_SEARCH.HEADER_ACTIONS.SHOW_CHART',
          show: 'asOverflow',
          actionCallback: () => this.toggleChartVisibility()
        }
      ]
      return actions
    })
  )

  defaultDataSortDirection = DataSortDirection.NONE
  defaultDiagramType = DiagramType.PIE

  diagramColumnId = 'name'
  diagramColumn$: Observable<DataTableColumn> = this.viewModel$.pipe(
    map((vm) => vm.columns.find((e) => e.id === this.diagramColumnId) as DataTableColumn)
  )

  public skillSearchFormGroup: FormGroup = this.formBuilder.group({
    ...(Object.fromEntries(skillSearchCriteriasSchema.keyof().options.map((k) => [k, null])) as Record<
      keyof SkillSearchCriteria,
      unknown
    >)
  } satisfies Record<keyof SkillSearchCriteria, unknown>)

  ngOnInit() {
    this.breadcrumbService.setItems([
      {
        titleKey: 'SKILL_SEARCH.BREADCRUMB',
        labelKey: 'SKILL_SEARCH.BREADCRUMB',
        routerLink: '/skill'
      }
    ])
    this.viewModel$.subscribe((vm) => this.skillSearchFormGroup.patchValue(vm.searchCriteria))
  }

  resultComponentStateChanged(state: InteractiveDataViewComponentState) {
    this.store.dispatch(skillSearchActions.resultComponentStateChanged(state))
  }

  searchHeaderComponentStateChanged(state: SearchHeaderComponentState) {
    this.store.dispatch(skillSearchActions.searchHeaderComponentStateChanged(state))
  }

  diagramComponentStateChanged(state: DiagramComponentState) {
    this.store.dispatch(skillSearchActions.diagramComponentStateChanged(state))
  }

  search(formValue: FormGroup) {
    const searchCriteria = buildSearchCriteria(formValue.getRawValue(), this.calendars, { removeNullValues: true })
    this.store.dispatch(skillSearchActions.searchButtonClicked({ searchCriteria }))
  }

  details({ id }: RowListGridData) {
    this.store.dispatch(skillSearchActions.detailsButtonClicked({ id }))
  }

  create() {
    this.store.dispatch(skillSearchActions.createSkillButtonClicked())
  }

  edit({ id }: RowListGridData) {
    this.store.dispatch(skillSearchActions.editSkillButtonClicked({ id }))
  }

  resetSearch() {
    this.store.dispatch(skillSearchActions.resetButtonClicked())
  }

  exportItems() {
    this.store.dispatch(skillSearchActions.exportButtonClicked())
  }

  toggleChartVisibility() {
    this.store.dispatch(skillSearchActions.chartVisibilityToggled())
  }
}

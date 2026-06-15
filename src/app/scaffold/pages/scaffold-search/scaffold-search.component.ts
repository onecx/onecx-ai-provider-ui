import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { isValidDate } from '@onecx/accelerator'
import {
  Action,
  AngularAcceleratorModule,
  BreadcrumbService,
  DataTableColumn,
  RowListGridData
} from '@onecx/angular-accelerator'
import { PrimeIcons } from 'primeng/api'
import { map, Observable } from 'rxjs'
import { ScaffoldSearchActions } from './scaffold-search.actions'
import { ScaffoldSearchCriteria, scaffoldSearchCriteriasSchema } from './scaffold-search.parameters'
import { selectScaffoldSearchViewModel } from './scaffold-search.selectors'
import { ScaffoldSearchViewModel } from './scaffold-search.viewmodel'
import { TranslateModule } from '@ngx-translate/core'
import { CommonModule } from '@angular/common'
import { LetDirective } from '@ngrx/component'
import { PortalPageComponent } from '@onecx/angular-utils'
import { InputTextModule } from 'primeng/inputtext'
import { FloatLabelModule } from 'primeng/floatlabel'

@Component({
  selector: 'app-scaffold-search',
  templateUrl: './scaffold-search.component.html',
  styleUrls: ['./scaffold-search.component.scss'],
  imports: [
    AngularAcceleratorModule,
    CommonModule,
    TranslateModule,
    FormsModule,
    FloatLabelModule,
    ReactiveFormsModule,
    LetDirective,
    InputTextModule,
    PortalPageComponent
  ]
})
export class ScaffoldSearchComponent implements OnInit {
  viewModel$!: Observable<ScaffoldSearchViewModel>
  headerActions$!: Observable<Action[]>
  public scaffoldSearchFormGroup!: FormGroup
  diagramColumnId = 'modelName'
  diagramColumn$!: Observable<DataTableColumn>

  constructor(
    private readonly breadcrumbService: BreadcrumbService,
    private readonly store: Store,
    private readonly formBuilder: FormBuilder,
    @Inject(LOCALE_ID) public readonly locale: string,
  ) {}

  ngOnInit() {
    this.viewModel$ = this.store.select(selectScaffoldSearchViewModel)

    this.headerActions$ = this.viewModel$.pipe(
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

    this.scaffoldSearchFormGroup = this.formBuilder.group({
      ...(Object.fromEntries(
        scaffoldSearchCriteriasSchema.keyof().options.map((k) => [k, null])
      ) as Record<keyof ScaffoldSearchCriteria, unknown>)
    } satisfies Record<keyof ScaffoldSearchCriteria, unknown>)

    this.breadcrumbService.setItems([
      {
        titleKey: 'SCAFFOLD_SEARCH.BREADCRUMB',
        labelKey: 'SCAFFOLD_SEARCH.BREADCRUMB',
        routerLink: '/scaffold'
      }
    ])

    this.viewModel$.subscribe((vm) => this.scaffoldSearchFormGroup.patchValue(vm.searchCriteria))
  }

  search(formValue: FormGroup) {
    const searchCriteria = Object.entries(formValue.getRawValue()).reduce(
      (acc: Partial<ScaffoldSearchCriteria>, [key, value]) => ({
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
            ).toISOString()
          : value || undefined
      }),
      {}
    )
    this.store.dispatch(ScaffoldSearchActions.searchButtonClicked({ searchCriteria }))
  }

  details({ id }: RowListGridData) {
    this.store.dispatch(ScaffoldSearchActions.detailsButtonClicked({ id }))
  }

  create() {
    this.store.dispatch(ScaffoldSearchActions.createScaffoldButtonClicked())
  }

  edit({ id }: RowListGridData) {
    this.store.dispatch(ScaffoldSearchActions.editScaffoldButtonClicked({ id }))
  }

  delete({ id }: RowListGridData) {
    this.store.dispatch(ScaffoldSearchActions.deleteScaffoldButtonClicked({ id }))
  }

  resetSearch() {
    this.store.dispatch(ScaffoldSearchActions.resetButtonClicked())
  }

  exportItems() {
    this.store.dispatch(ScaffoldSearchActions.exportButtonClicked())
  }

  viewModeChanged(viewMode: 'basic' | 'advanced') {
    this.store.dispatch(ScaffoldSearchActions.viewModeChanged({ viewMode }))
  }

  onDisplayedColumnsChange(event: Event): void {
    const displayedColumns = (event as CustomEvent<DataTableColumn[]>).detail
    this.store.dispatch(ScaffoldSearchActions.displayedColumnsChanged({ displayedColumns }))
  }

  toggleChartVisibility() {
    this.store.dispatch(ScaffoldSearchActions.chartVisibilityToggled())
  }
}

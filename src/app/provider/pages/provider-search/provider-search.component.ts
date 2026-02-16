import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { Store } from '@ngrx/store'
import { isValidDate } from '@onecx/accelerator'
import {
  Action,
  BreadcrumbService,
  DataTableColumn,
  ExportDataService,
  RowListGridData
} from '@onecx/portal-integration-angular'
import { PrimeIcons } from 'primeng/api'
import { map, Observable } from 'rxjs'
import { ProviderSearchActions } from './provider-search.actions'
import { ProviderSearchCriteria, ProviderSearchCriteriasSchema } from './provider-search.parameters'
import { selectProviderSearchViewModel } from './provider-search.selectors'
import { ProviderSearchViewModel } from './provider-search.viewmodel'

@Component({
  selector: 'app-provider-search',
  templateUrl: './provider-search.component.html',
  styleUrls: ['./provider-search.component.scss']
})
export class ProviderSearchComponent implements OnInit {
  viewModel$!: Observable<ProviderSearchViewModel>
  headerActions$!: Observable<Action[]>
  public ProviderSearchFormGroup!: FormGroup
  diagramColumnId = 'modelName'
  diagramColumn$!: Observable<DataTableColumn>

  constructor(
    private readonly breadcrumbService: BreadcrumbService,
    private readonly store: Store,
    private readonly formBuilder: FormBuilder,
    @Inject(LOCALE_ID) public readonly locale: string,
    private readonly exportDataService: ExportDataService
  ) {}

  ngOnInit() {
    this.viewModel$ = this.store.select(selectProviderSearchViewModel)
    this.headerActions$ = this.viewModel$.pipe(
      map((vm) => {
        const actions: Action[] = [
          {
            labelKey: 'PROVIDER_CREATE_UPDATE.ACTION.CREATE',
            icon: PrimeIcons.PLUS,
            show: 'always',
            actionCallback: () => this.create()
          },
          {
            labelKey: 'PROVIDER_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
            icon: PrimeIcons.DOWNLOAD,
            titleKey: 'PROVIDER_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
            show: 'asOverflow',
            actionCallback: () => this.exportItems()
          },
          {
            labelKey: vm.chartVisible
              ? 'PROVIDER_SEARCH.HEADER_ACTIONS.HIDE_CHART'
              : 'PROVIDER_SEARCH.HEADER_ACTIONS.SHOW_CHART',
            icon: PrimeIcons.EYE,
            titleKey: vm.chartVisible
              ? 'PROVIDER_SEARCH.HEADER_ACTIONS.HIDE_CHART'
              : 'PROVIDER_SEARCH.HEADER_ACTIONS.SHOW_CHART',
            show: 'asOverflow',
            actionCallback: () => this.toggleChartVisibility()
          }
        ]
        return actions
      })
    )

    this.diagramColumn$ = this.viewModel$.pipe(
      map((vm) => vm.columns.find((e) => e.id === this.diagramColumnId) as DataTableColumn)
    )

    this.ProviderSearchFormGroup = this.formBuilder.group({
      ...(Object.fromEntries(ProviderSearchCriteriasSchema.keyof().options.map((k) => [k, null])) as Record<
        keyof ProviderSearchCriteria,
        unknown
      >)
    } satisfies Record<keyof ProviderSearchCriteria, unknown>)

    this.breadcrumbService.setItems([
      {
        titleKey: 'PROVIDER_SEARCH.BREADCRUMB',
        labelKey: 'PROVIDER_SEARCH.BREADCRUMB',
        routerLink: '/provider'
      }
    ])
    this.viewModel$.subscribe((vm) => this.ProviderSearchFormGroup.patchValue(vm.searchCriteria))
  }

  search(formValue: FormGroup) {
    const searchCriteria = Object.entries(formValue.getRawValue()).reduce(
      (acc: Partial<ProviderSearchCriteria>, [key, value]) => ({
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
    this.store.dispatch(ProviderSearchActions.searchButtonClicked({ searchCriteria }))
  }

  details({ id }: RowListGridData) {
    this.store.dispatch(ProviderSearchActions.detailsButtonClicked({ id }))
  }

  create() {
    this.store.dispatch(ProviderSearchActions.createProviderButtonClicked())
  }

  edit({ id }: RowListGridData) {
    this.store.dispatch(ProviderSearchActions.editProviderButtonClicked({ id }))
  }

  delete({ id }: RowListGridData) {
    this.store.dispatch(ProviderSearchActions.deleteProviderButtonClicked({ id }))
  }

  resetSearch() {
    this.store.dispatch(ProviderSearchActions.resetButtonClicked())
  }

  exportItems() {
    this.store.dispatch(ProviderSearchActions.exportButtonClicked())
  }

  viewModeChanged(viewMode: 'basic' | 'advanced') {
    this.store.dispatch(
      ProviderSearchActions.viewModeChanged({
        viewMode: viewMode
      })
    )
  }

  onDisplayedColumnsChange(displayedColumns: DataTableColumn[]) {
    this.store.dispatch(ProviderSearchActions.displayedColumnsChanged({ displayedColumns }))
  }

  toggleChartVisibility() {
    this.store.dispatch(ProviderSearchActions.chartVisibilityToggled())
  }
}

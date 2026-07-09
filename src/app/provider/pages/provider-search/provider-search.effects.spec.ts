import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store, StoreModule } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'
import { AlwaysGrantPermissionChecker, HAS_PERMISSION_CHECKER, providePermissionService } from '@onecx/angular-utils'
import { AngularAcceleratorModule, ColumnType } from '@onecx/angular-accelerator'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'
import { ProviderSearchActions } from './provider-search.actions'
import { ProviderSearchColumns } from './provider-search.columns'
import { ProviderSearchComponent } from './provider-search.component'
import { ProviderSearchHarness } from './provider-search.harness'
import { initialState } from './provider-search.reducers'
import { selectProviderSearchViewModel } from './provider-search.selectors'
import { ProviderSearchViewModel } from './provider-search.viewmodel'

describe('ProviderSearchComponent effects', () => {
  let component: ProviderSearchComponent
  let fixture: ComponentFixture<ProviderSearchComponent>
  let store: MockStore<Store>
  let formBuilder: FormBuilder
  let ProviderSearch: ProviderSearchHarness

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseProviderSearchViewModel: ProviderSearchViewModel = {
    columns: ProviderSearchColumns,
    searchCriteria: {
      name: undefined,
      llmUrl: undefined,
      description: undefined,
      id: undefined
    },
    results: [],
    displayedColumns: [],
    viewMode: 'basic',
    chartVisible: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        AngularAcceleratorModule,
        LetDirective,
        ProviderSearchComponent,
        ReactiveFormsModule,
        StoreModule.forRoot({}),
        TranslateTestingModule.withTranslations({
          'en': require('./src/assets/i18n/en.json'),
          'de': require('./src/assets/i18n/de.json')
        }).withDefaultLanguage('en'),
        NoopAnimationsModule
      ],
      providers: [
        ...providePermissionService(),
        DialogService,
        provideMockStore({
          initialState: { Provider: { search: initialState } }
        }),
        FormBuilder,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideUserServiceMock(),
        {
          provide: HAS_PERMISSION_CHECKER,
          useClass: AlwaysGrantPermissionChecker
        }
      ]
    }).compileComponents()
    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')
    formBuilder = TestBed.inject(FormBuilder)

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectProviderSearchViewModel, baseProviderSearchViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(ProviderSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    ProviderSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, ProviderSearchHarness)
  })

  it('should dispatch resetButtonClicked action on resetSearch', async () => {
    const doneFn = jest.fn()
    store.overrideSelector(selectProviderSearchViewModel, {
      ...baseProviderSearchViewModel,
      results: [
        {
          id: '1',
          imagePath: '',
          column_1: 'val_1'
        }
      ],
      columns: [
        {
          columnType: ColumnType.STRING,
          nameKey: 'COLUMN_KEY',
          id: 'column_1'
        }
      ]
    })
    store.refreshState()

    store.scannedActions$.pipe(ofType(ProviderSearchActions.resetButtonClicked)).subscribe(() => {
      doneFn()
    })

    component.resetSearch()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should dispatch searchButtonClicked action on search', (done) => {
    const formValue = formBuilder.group({
      name: '123'
    })
    component.ProviderSearchFormGroup = formValue

    store.scannedActions$.pipe(ofType(ProviderSearchActions.searchButtonClicked)).subscribe((a) => {
      expect(a.searchCriteria).toEqual({ name: '123' })
      done()
    })

    component.search(formValue)
  })

  it('should dispatch detailsButtonClicked action on item details click', async () => {
    jest.spyOn(store, 'dispatch')

    store.overrideSelector(selectProviderSearchViewModel, {
      ...baseProviderSearchViewModel,
      results: [
        {
          id: '1',
          imagePath: '',
          column_1: 'val_1'
        }
      ],
      columns: [
        {
          columnType: ColumnType.STRING,
          nameKey: 'COLUMN_KEY',
          id: 'column_1'
        }
      ]
    })
    store.refreshState()

    const interactiveDataView = await ProviderSearch.getSearchResults()
    const dataView = await interactiveDataView.getDataView()
    const dataTable = await dataView.getDataTable()
    const rowActionButtons = await dataTable?.getActionButtons()

    expect(rowActionButtons?.length).toEqual(3)
    expect(await rowActionButtons?.at(0)?.getAttribute('ng-reflect-icon')).toEqual('pi pi-eye')
    await rowActionButtons?.at(0)?.click()

    expect(store.dispatch).toHaveBeenCalledWith(ProviderSearchActions.detailsButtonClicked({ id: '1' }))
  })

  it('should dispatch viewModeChanged action on view mode changes', async () => {
    jest.spyOn(store, 'dispatch')

    component.viewModeChanged('advanced')

    expect(store.dispatch).toHaveBeenCalledWith(ProviderSearchActions.viewModeChanged({ viewMode: 'advanced' }))
  })

  it('should dispatch displayedColumnsChanged on data view column change', async () => {
    jest.spyOn(store, 'dispatch')

    const fixture = TestBed.createComponent(ProviderSearchComponent)
    const component = fixture.componentInstance
    fixture.detectChanges()

    const columns = [
      {
        columnType: ColumnType.STRING,
        nameKey: 'COLUMN_KEY',
        id: 'column_1'
      },
      {
        columnType: ColumnType.STRING,
        nameKey: 'SECOND_COLUMN_KEY',
        id: 'column_2'
      }
    ]

    component.onDisplayedColumnsChange(
      new CustomEvent('displayedColumnsChange', {
        detail: columns
      })
    )

    expect(store.dispatch).toHaveBeenCalledWith(
      ProviderSearchActions.displayedColumnsChanged({
        displayedColumns: columns
      })
    )
  })

  it('should dispatch chartVisibilityToggled on show/hide chart header', async () => {
    jest.spyOn(store, 'dispatch')

    store.overrideSelector(selectProviderSearchViewModel, {
      ...baseProviderSearchViewModel,
      chartVisible: false
    })
    store.refreshState()

    const searchHeader = await ProviderSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const showChartActionItem = await pageHeader.getOverFlowMenuItem('Show chart')
    await showChartActionItem!.selectItem()
    expect(store.dispatch).toHaveBeenCalledWith(ProviderSearchActions.chartVisibilityToggled())
  })

  it('should dispatch createProviderButtonClicked action on create()', () => {
    jest.spyOn(store, 'dispatch')
    component.create()
    expect(store.dispatch).toHaveBeenCalledWith(ProviderSearchActions.createProviderButtonClicked())
  })

  it('should dispatch editProviderButtonClicked action on edit()', () => {
    jest.spyOn(store, 'dispatch')
    component.edit({ id: '123', imagePath: '' })
    expect(store.dispatch).toHaveBeenCalledWith(ProviderSearchActions.editProviderButtonClicked({ id: '123' }))
  })
  it('should call create() when headerActions$ actionCallback is triggered', (done) => {
    jest.spyOn(component, 'create')
    jest.spyOn(store, 'dispatch')

    component.ngOnInit()
    component.headerActions$.subscribe((actions) => {
      const createAction = actions.find((a) => a.labelKey === 'PROVIDER_CREATE_UPDATE.ACTION.CREATE')
      expect(createAction).toBeTruthy()
      createAction!.actionCallback()
      expect(component.create).toHaveBeenCalled()
      expect(store.dispatch).toHaveBeenCalledWith(ProviderSearchActions.createProviderButtonClicked())
      done()
    })
  })
})


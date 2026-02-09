import { PrimeIcons } from 'primeng/api'
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
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
import {
  AlwaysGrantPermissionChecker,
  BreadcrumbService,
  ColumnType,
  HAS_PERMISSION_CHECKER,
  PortalCoreModule,
  RowListGridData,
  UserService
} from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'
import { ConfigurationSearchActions } from './configuration-search.actions'
import { configurationSearchColumns } from './configuration-search.columns'
import { ConfigurationSearchComponent } from './configuration-search.component'
import { ConfigurationSearchHarness } from './configuration-search.harness'
import { initialState } from './configuration-search.reducers'
import { selectConfigurationSearchViewModel } from './configuration-search.selectors'
import { ConfigurationSearchViewModel } from './configuration-search.viewmodel'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'

describe('ConfigurationSearchComponent', () => {
  let component: ConfigurationSearchComponent
  let fixture: ComponentFixture<ConfigurationSearchComponent>
  let store: MockStore<Store>
  let formBuilder: FormBuilder
  let ConfigurationSearch: ConfigurationSearchHarness

  const baseConfigurationSearchViewModel: ConfigurationSearchViewModel = {
    columns: configurationSearchColumns,
    searchCriteria: {    
      name: '',
      description: ''
    },
    results: [],
    displayedColumns: [],
    chartVisible: false,
    resultComponentState: null,
    searchHeaderComponentState: null,
    diagramComponentState: null,
    searchLoadingIndicator: false,
    searchExecuted: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfigurationSearchComponent],
      imports: [
        PortalCoreModule,
        LetDirective,
        ReactiveFormsModule,
        StoreModule.forRoot({}),
        TranslateTestingModule.withTranslations('en', require('./../../../../assets/i18n/en.json')).withTranslations(
          'de',
          require('./../../../../assets/i18n/de.json')
        ),
        NoopAnimationsModule
      ],
      providers: [
        DialogService,
        provideMockStore({
          initialState: { Configuration: { search: initialState } }
        }),
        FormBuilder,
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} } } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideUserServiceMock(),
        {
          provide: HAS_PERMISSION_CHECKER,
          useClass: AlwaysGrantPermissionChecker
        }
      ]
    }).compileComponents()
  })

  beforeEach(async () => {
    const userService = TestBed.inject(UserService)
    userService.hasPermission = () => true
    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')
    formBuilder = TestBed.inject(FormBuilder)

    store = TestBed.inject(MockStore)
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectConfigurationSearchViewModel, baseConfigurationSearchViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(ConfigurationSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    ConfigurationSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, ConfigurationSearchHarness)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should dispatch resetButtonClicked action on resetSearch', async () => {
    const doneFn = jest.fn()
    store.overrideSelector(selectConfigurationSearchViewModel, {
      ...baseConfigurationSearchViewModel,
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

    store.scannedActions$.pipe(ofType(ConfigurationSearchActions.resetButtonClicked)).subscribe(() => {
      doneFn()
    })

    const searchHeader = await ConfigurationSearch.getHeader()
    await searchHeader.clickResetButton()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should have 2 overFlow header actions when search config is disabled', async () => {
    const searchHeader = await ConfigurationSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const overflowMenuItems = await pageHeader.getOverFlowMenuItems()
    expect(overflowMenuItems.length).toBe(2)

    const exportAllActionItem = await pageHeader.getOverFlowMenuItem('Export all')
    expect(await exportAllActionItem!.getText()).toBe('Export all')

    const showHideChartActionItem = await pageHeader.getOverFlowMenuItem('Show chart')
    expect(await showHideChartActionItem!.getText()).toBe('Show chart')
  })

  it('should display hide chart action if chart is visible', async () => {
    store.overrideSelector(selectConfigurationSearchViewModel, {
      ...baseConfigurationSearchViewModel,
      chartVisible: true
    })
    store.refreshState()

    const searchHeader = await ConfigurationSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const overflowMenuItems = await pageHeader.getOverFlowMenuItems()
    expect(overflowMenuItems.length).toBe(2)

    const showHideChartActionItem = await pageHeader.getOverFlowMenuItem('Hide chart')
    expect(await showHideChartActionItem!.getText()).toEqual('Hide chart')
  })

  it('should display chosen column in the diagram', async () => {
    component.diagramColumnId = 'column_1'
    store.overrideSelector(selectConfigurationSearchViewModel, {
      ...baseConfigurationSearchViewModel,
      chartVisible: true,
      results: [
        {
          id: '1',
          imagePath: '',
          column_1: 'val_1'
        },
        {
          id: '2',
          imagePath: '',
          column_1: 'val_2'
        },
        {
          id: '3',
          imagePath: '',
          column_1: 'val_2'
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

    const diagram = await (await ConfigurationSearch.getDiagram())!.getDiagram()

    expect(await diagram.getTotalNumberOfResults()).toBe(3)
    expect(await diagram.getSumLabel()).toEqual('Total')
  })

  it('should display correct breadcrumbs', async () => {
    const breadcrumbService = TestBed.inject(BreadcrumbService)
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    const searchHeader = await ConfigurationSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Search')
    expect(await searchBreadcrumbItem!.getText()).toEqual('Search')
  })

  it('should dispatch searchButtonClicked action on search', (done) => {
    const formValue = formBuilder.group({
      changeMe: '123'
    })
    component.configurationSearchFormGroup = formValue

    store.scannedActions$.pipe(ofType(ConfigurationSearchActions.searchButtonClicked)).subscribe((a) => {
      expect(a.searchCriteria).toEqual({ changeMe: '123' })
      done()
    })

    component.search(formValue)
  })

  it('should dispatch editConfigurationButtonClicked action on item edit click', async () => {

    store.overrideSelector(selectConfigurationSearchViewModel, {
      ...baseConfigurationSearchViewModel,
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

    const interactiveDataView = await ConfigurationSearch.getSearchResults()
    const dataView = await interactiveDataView.getDataView()
    const dataTable = await dataView.getDataTable()
    const rowActionButtons = await dataTable?.getActionButtons()

    expect(rowActionButtons?.length).toBeGreaterThan(0)
    let editButton
    for (const actionButton of rowActionButtons ?? []) {
      const icon = await actionButton.getAttribute('ng-reflect-icon')
      expect(icon).toBeTruthy()
      if (icon == 'pi pi-pencil') {
        editButton = actionButton
      }
    }
    expect(editButton).toBeTruthy()
    editButton?.click()

    expect(store.dispatch).toHaveBeenCalledWith(ConfigurationSearchActions.editConfigurationButtonClicked({ id: '1' }))
  })

  it('should dispatch createConfigurationButtonClicked action on create click', async () => {

    const header = await ConfigurationSearch.getHeader()
    const createButton = await (await header.getPageHeader()).getInlineActionButtonByIcon(PrimeIcons.PLUS)

    expect(createButton).toBeTruthy()
    await createButton?.click()

    expect(store.dispatch).toHaveBeenCalledWith(ConfigurationSearchActions.createConfigurationButtonClicked())
  })

  it('should dispatch detailsButtonClicked action on details', () => {
    const row: RowListGridData = { id: 'test-id', imagePath: '' }
    component.details(row)
    expect(store.dispatch).toHaveBeenCalledWith(ConfigurationSearchActions.detailsButtonClicked({ id: 'test-id' }))
  })

  describe('searchCriteria mapping', () => {
    const cases = [
      {
        desc: 'should convert Date values to UTC and dispatch searchButtonClicked',
        formValue: { name: new Date(2024, 4, 15, 12, 30, 45) },
        expected: { name: new Date(Date.UTC(2024, 4, 15, 12, 30, 45)).toISOString() }
      },
      {
        desc: 'should pass through non-date, non-empty values unchanged',
        formValue: { name: 'testName' },
        expected: { name: 'testName' }
      },
      {
        desc: 'should set searchCriteria property to undefined for falsy non-date values',
        formValue: { name: '' },
        expected: { name: undefined }
      }
    ]
    cases.forEach(({ desc, formValue, expected }) => {
      it(desc, () => {
        component.configurationSearchFormGroup = {
          value: formValue,
          getRawValue: () => formValue
        } as any
        component.search(component.configurationSearchFormGroup)

        const calls = (store.dispatch as jest.Mock).mock.calls
        const found = calls.some(call => {
          const action = call[0]
          return (
            action.type === '[ConfigurationSearch] Search button clicked' &&
            action.searchCriteria &&
            (
              (action.searchCriteria.name instanceof Date
                ? action.searchCriteria.name.toISOString()
                : action.searchCriteria.name
              ) === expected.name
            )
          )
        })
        expect(found).toBe(true)
      })
    })
  })

  it('should handle isValidDate true branch for allowed key (using as any for coverage)', () => {
    const testDate = new Date(2024, 4, 15, 12, 30, 45)
    const formValue = {
      description: testDate as any
    }
    component.configurationSearchFormGroup = {
      value: formValue,
      getRawValue: () => formValue
    } as any

    component.search(component.configurationSearchFormGroup)

    expect(store.dispatch).toHaveBeenCalledWith(
      ConfigurationSearchActions.searchButtonClicked({
        searchCriteria: {
          description: new Date(
            Date.UTC(
              testDate.getFullYear(),
              testDate.getMonth(),
              testDate.getDate(),
              testDate.getHours(),
              testDate.getMinutes(),
              testDate.getSeconds()
            )
          ) as any
        }
      })
    )
  })

  describe('actions dispatch', () => {
    [
      {
        method: 'resultComponentStateChanged',
        action: ConfigurationSearchActions.resultComponentStateChanged,
        payload: { groupKey: 'test-group' }
      },
      {
        method: 'searchHeaderComponentStateChanged',
        action: ConfigurationSearchActions.searchHeaderComponentStateChanged,
        payload: { activeViewMode: 'basic', selectedSearchConfig: 'config1' } as const
      },
      {
        method: 'diagramComponentStateChanged',
        action: ConfigurationSearchActions.diagramComponentStateChanged,
        payload: { label: 'Test Diagram' }
      }
    ].forEach(({ method, action, payload }) => {
      it(`should dispatch ${action.type} when ${method} is called`, () => {
        (component as any)[method](payload)
        expect(store.dispatch).toHaveBeenCalledWith(action(payload))
      })
    })
  })

  it('should export csv data on export action click', async () => {

    const results = [
      {
        id: '1',
        imagePath: '',
        column_1: 'val_1'
      }
    ]
    const columns = [
      {
        columnType: ColumnType.STRING,
        nameKey: 'COLUMN_KEY',
        id: 'column_1'
      }
    ]
    store.overrideSelector(selectConfigurationSearchViewModel, {
      ...baseConfigurationSearchViewModel,
      results: results,
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const searchHeader = await ConfigurationSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const exportAllActionItem = await pageHeader.getOverFlowMenuItem('Export all')
    await exportAllActionItem!.selectItem()

    expect(store.dispatch).toHaveBeenCalledWith(ConfigurationSearchActions.exportButtonClicked())
  })

  it('should dispatch viewModeChanged action on view mode changes', async () => {

    component.viewModeChanged('advanced')

    expect(store.dispatch).toHaveBeenCalledWith(ConfigurationSearchActions.viewModeChanged({ viewMode: 'advanced' }))
  })

  it('should dispatch displayedColumnsChanged on data view column change', async () => {

    fixture = TestBed.createComponent(ConfigurationSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    ConfigurationSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, ConfigurationSearchHarness)

    expect(store.dispatch).toHaveBeenCalledWith(
      ConfigurationSearchActions.displayedColumnsChanged({ displayedColumns: configurationSearchColumns })
    )

    jest.clearAllMocks()

    store.overrideSelector(selectConfigurationSearchViewModel, {
      ...baseConfigurationSearchViewModel,
      columns: [
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
    })
    store.refreshState()

    const interactiveDataView = await ConfigurationSearch.getSearchResults()
    const columnGroupSelector = await interactiveDataView?.getCustomGroupColumnSelector()
    expect(columnGroupSelector).toBeTruthy()
    await columnGroupSelector!.openCustomGroupColumnSelectorDialog()
    const pickList = await columnGroupSelector!.getPicklist()
    const transferControlButtons = await pickList.getTransferControlsButtons()
    expect(transferControlButtons.length).toBe(4)
    const activateAllColumnsButton = transferControlButtons[3]
    await activateAllColumnsButton.click()
    const saveButton = await columnGroupSelector!.getSaveButton()
    await saveButton.click()

    expect(store.dispatch).toHaveBeenCalledWith(
      ConfigurationSearchActions.displayedColumnsChanged({
        displayedColumns: [
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
      })
    )
  })

  it('should dispatch chartVisibilityToggled on show/hide chart header', async () => {

    store.overrideSelector(selectConfigurationSearchViewModel, {
      ...baseConfigurationSearchViewModel,
      chartVisible: false
    })
    store.refreshState()

    const searchHeader = await ConfigurationSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const showChartActionItem = await pageHeader.getOverFlowMenuItem('Show chart')
    await showChartActionItem!.selectItem()
    expect(store.dispatch).toHaveBeenCalledWith(ConfigurationSearchActions.chartVisibilityToggled())
  })

  it('should display translated headers', async () => {
    const searchHeader = await ConfigurationSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    expect(await pageHeader.getHeaderText()).toEqual('Configuration Search')
    expect(await pageHeader.getSubheaderText()).toEqual('Searching and displaying of Configuration')
  })

  it('should display translated empty message when no search results', async () => {
    const columns = [
      {
        columnType: ColumnType.STRING,
        nameKey: 'COLUMN_KEY',
        id: 'column_1'
      }
    ]
    store.overrideSelector(selectConfigurationSearchViewModel, {
      ...baseConfigurationSearchViewModel,
      results: [],
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const interactiveDataView = await ConfigurationSearch.getSearchResults()
    const dataView = await interactiveDataView.getDataView()
    const dataTable = await dataView.getDataTable()
    const rows = await dataTable?.getRows()
    expect(rows?.length).toBe(1)

    const rowData = await rows?.at(0)?.getData()
    expect(rowData?.length).toBe(1)
    expect(rowData?.at(0)).toEqual('No results.')
  })

  it.each([
    {
      desc: 'should not display chart when no results',
      viewModel: {
        ...baseConfigurationSearchViewModel,
        results: [],
        chartVisible: true,
        columns: [{ columnType: ColumnType.STRING, nameKey: 'COLUMN_KEY', id: 'column_1' }]
      },
      expected: null
    },
    {
      desc: 'should not display chart when toggled to not visible',
      viewModel: {
        ...baseConfigurationSearchViewModel,
        results: [{ id: '1', imagePath: '', column_1: 'val_1' }],
        chartVisible: false,
        columns: [{ columnType: ColumnType.STRING, nameKey: 'COLUMN_KEY', id: 'column_1' }]
      },
      expected: null
    },
    {
      desc: 'should display chart when results and chartVisible are true',
      viewModel: {
        ...baseConfigurationSearchViewModel,
        results: [{ id: '1', imagePath: '', column_1: 'val_1' }],
        chartVisible: true,
        columns: [{ columnType: ColumnType.STRING, nameKey: 'COLUMN_KEY', id: 'column_1' }]
      },
      expected: true
    }
  ])('$desc', async ({ viewModel, expected }) => {
    component.diagramColumnId = 'column_1'
    store.overrideSelector(selectConfigurationSearchViewModel, viewModel)
    store.refreshState()
    const diagram = await ConfigurationSearch.getDiagram()
    if (expected === null) {
      expect(diagram).toBeNull()
    } else {
      expect(diagram).toBeTruthy()
    }
  })
})

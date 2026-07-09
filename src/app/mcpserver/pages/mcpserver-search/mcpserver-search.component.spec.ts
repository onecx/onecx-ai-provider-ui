import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { By } from '@angular/platform-browser'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store, StoreModule } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { getUTCDateWithoutTimezoneIssues } from '@onecx/accelerator'
import { AngularAcceleratorModule, ColumnType, DiagramType } from '@onecx/angular-accelerator'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'
import { AlwaysGrantPermissionChecker, HAS_PERMISSION_CHECKER, providePermissionService } from '@onecx/angular-utils'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'
import { MCPServerSearchActions } from './mcpserver-search.actions'
import { mcpserverSearchColumns } from './mcpserver-search.columns'
import { MCPServerSearchComponent } from './mcpserver-search.component'
import { MCPServerSearchHarness } from './mcpserver-search.harness'
import { initialState } from './mcpserver-search.reducers'
import { selectMCPServerSearchViewModel } from './mcpserver-search.selectors'
import { MCPServerSearchViewModel } from './mcpserver-search.viewmodel'

describe('MCPServerSearchComponent', () => {
  const origAddEventListener = window.addEventListener
  const origPostMessage = window.postMessage

  let listeners: any[] = []
  window.addEventListener = (_type: any, listener: any) => {
    listeners.push(listener)
  }

  window.removeEventListener = (_type: any, listener: any) => {
    listeners = listeners.filter((l) => l !== listener)
  }

  window.postMessage = (m: any) => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    listeners.forEach((l) =>
      l({
        data: m,
        stopImmediatePropagation: () => {},
        stopPropagation: () => {}
      })
    )
  }

  afterAll(() => {
    window.addEventListener = origAddEventListener
    window.postMessage = origPostMessage
  })

  HTMLCanvasElement.prototype.getContext = jest.fn()
  let component: MCPServerSearchComponent
  let fixture: ComponentFixture<MCPServerSearchComponent>
  let store: MockStore<Store>
  let formBuilder: FormBuilder
  let mcpserverSearch: MCPServerSearchHarness

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseMCPServerSearchViewModel: MCPServerSearchViewModel = {
    columns: mcpserverSearchColumns,
    searchCriteria: { name: '' },
    searchExecuted: true,
    results: [],
    searchLoadingIndicator: false,
    diagramComponentState: null,
    resultComponentState: null,
    searchHeaderComponentState: null,
    chartVisible: false
  }

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }))
    })
  })

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        AngularAcceleratorModule,
        LetDirective,
        MCPServerSearchComponent,
        ReactiveFormsModule,
        StoreModule.forRoot({}),
        FormsModule,
        TranslateTestingModule.withTranslations({
          en: require('./src/assets/i18n/en.json'),
          de: require('./src/assets/i18n/de.json')
        }).withDefaultLanguage('en'),
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        ...providePermissionService(),
        DialogService,
        provideMockStore({
          initialState: { mcpserver: { search: initialState } }
        }),
        FormBuilder,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideUserServiceMock(),
        {
          provide: HAS_PERMISSION_CHECKER,
          useClass: AlwaysGrantPermissionChecker
        }
      ]
    }).compileComponents()
  })

  beforeEach(async () => {
    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')
    formBuilder = TestBed.inject(FormBuilder)

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectMCPServerSearchViewModel, baseMCPServerSearchViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(MCPServerSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    mcpserverSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, MCPServerSearchHarness)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should dispatch resetButtonClicked action on resetSearch', async () => {
    const doneFn = jest.fn()
    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      results: [
        {
          id: '1',
          imagePath: '',
          name: 'val_1'
        }
      ],
      columns: [
        {
          columnType: ColumnType.STRING,
          id: 'name',
          nameKey: 'HELLO_SEARCH.RESULTS.HELLO',
          filterable: true,
          sortable: true,
          predefinedGroupKeys: [
            'HELLO_SEARCH.PREDEFINED_GROUP.DEFAULT',
            'HELLO_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'HELLO_SEARCH.PREDEFINED_GROUP.FULL'
          ]
        }
      ]
    })
    store.refreshState()

    store.scannedActions$.pipe(ofType(MCPServerSearchActions.resetButtonClicked)).subscribe(() => {
      doneFn()
    })

    component.resetSearch()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should have 2 overFlow header actions when search config is disabled', async () => {
    const searchHeader = await mcpserverSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const overflowMenuItems = await pageHeader.getOverFlowMenuItems()
    expect(overflowMenuItems).toHaveLength(2)

    const exportAllActionItem = await pageHeader.getOverFlowMenuItem('Export all')
    expect(await exportAllActionItem!.getText()).toBe('Export all')

    const showHideChartActionItem = await pageHeader.getOverFlowMenuItem('Show chart')
    expect(await showHideChartActionItem!.getText()).toBe('Show chart')
  })

  it('should display hide chart action if chart is visible', async () => {
    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      chartVisible: true
    })
    store.refreshState()

    const searchHeader = await mcpserverSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const overflowMenuItems = await pageHeader.getOverFlowMenuItems()
    expect(overflowMenuItems).toHaveLength(2)

    const showHideChartActionItem = await pageHeader.getOverFlowMenuItem('Hide chart')
    expect(await showHideChartActionItem!.getText()).toEqual('Hide chart')
  })

  it('should display chosen column in the diagram', async () => {
    component.diagramColumnId = 'name'
    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      chartVisible: true,
      results: [
        {
          id: '1',
          imagePath: '',
          name: 'val_1'
        },
        {
          id: '2',
          imagePath: '',
          name: 'val_2'
        },
        {
          id: '3',
          imagePath: '',
          name: 'val_2'
        }
      ],
      columns: [
        {
          columnType: ColumnType.STRING,
          id: 'name',
          nameKey: 'HELLO_SEARCH.RESULTS.HELLO',
          filterable: true,
          sortable: true,
          predefinedGroupKeys: [
            'HELLO_SEARCH.PREDEFINED_GROUP.DEFAULT',
            'HELLO_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'HELLO_SEARCH.PREDEFINED_GROUP.FULL'
          ]
        }
      ]
    })
    store.refreshState()

    const diagram = await (await mcpserverSearch.getDiagram())!.getDiagram()

    expect(await diagram.getTotalNumberOfResults()).toBe(3)
    expect(await diagram.getSumLabel()).toEqual('Total')
  })

  it('should display correct breadcrumbs', async () => {
    const breadcrumbService = component['breadcrumbService']
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    const searchHeader = await mcpserverSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Search')

    expect(await searchBreadcrumbItem!.getText()).toEqual('Search')
  })

  it('should reset form when search criteria becomes empty object', () => {
    const resetSpy = jest.spyOn(component.mcpserverSearchFormGroup, 'reset')

    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      searchCriteria: {}
    })
    store.refreshState()

    expect(resetSpy).toHaveBeenCalled()
  })

  it('should dispatch searchButtonClicked action on search', () => {
    jest.spyOn(store, 'dispatch')
    const sampleDate = new Date(2024, 5, 1, 10, 0, 0)
    const formValue = formBuilder.group({
      name: 'just text',
      description: sampleDate
    })
    component.mcpserverSearchFormGroup = formValue

    component.search(formValue)

    expect(store.dispatch).toHaveBeenCalledWith(
      MCPServerSearchActions.searchButtonClicked({
        searchCriteria: {
          name: 'just text',
          description: getUTCDateWithoutTimezoneIssues(sampleDate)
        } as any
      })
    )
  })

  it('should dispatch viewModeChanged action on view mode changes', async () => {
    jest.spyOn(store, 'dispatch')

    component.searchHeaderComponentStateChanged({
      activeViewMode: 'advanced'
    })

    expect(store.dispatch).toHaveBeenCalledWith(
      MCPServerSearchActions.searchHeaderComponentStateChanged({
        activeViewMode: 'advanced'
      })
    )
  })

  it('should dispatch detailsButtonClicked action on details clicked', async () => {
    jest.spyOn(store, 'dispatch')
    const results = [
      {
        id: '1',
        imagePath: '',
        name: 'val_1'
      }
    ]
    const columns = [
      {
        columnType: ColumnType.STRING,
        id: 'name',
        nameKey: 'HELLO_SEARCH.RESULTS.HELLO',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
          'HELLO_SEARCH.PREDEFINED_GROUP.DEFAULT',
          'HELLO_SEARCH.PREDEFINED_GROUP.EXTENDED',
          'HELLO_SEARCH.PREDEFINED_GROUP.FULL'
        ]
      }
    ]
    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      results: results,
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()
    const interactiveDataView = await mcpserverSearch.getSearchResults()
    const dataView = await interactiveDataView.getDataView()
    const dataTable = await dataView.getDataTable()
    const editButtons = await dataTable?.getActionButtons()

    await editButtons?.at(0)?.click()

    expect(store.dispatch).toHaveBeenCalledWith(MCPServerSearchActions.detailsButtonClicked({ id: '1' }))
  })

  it('should dispatch diagramComponentStateChanged action on diagram mode changes', async () => {
    jest.spyOn(store, 'dispatch')

    component.diagramComponentStateChanged({
      activeDiagramType: DiagramType.PIE
    })

    expect(store.dispatch).toHaveBeenCalledWith(
      MCPServerSearchActions.diagramComponentStateChanged({
        activeDiagramType: DiagramType.PIE
      })
    )
  })

  it('should dispatch displayedColumnsChanged on data view column change', async () => {
    jest.spyOn(store, 'dispatch')
    const columns = [
      {
        columnType: ColumnType.STRING,
        id: 'name',
        nameKey: 'HELLO_SEARCH.RESULTS.HELLO',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
          'HELLO_SEARCH.PREDEFINED_GROUP.DEFAULT',
          'HELLO_SEARCH.PREDEFINED_GROUP.EXTENDED',
          'HELLO_SEARCH.PREDEFINED_GROUP.FULL'
        ]
      }
    ]
    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      results: [],
      columns: columns,
      resultComponentState: {
        layout: 'table',
        displayedColumns: columns
      }
    })
    store.refreshState()

    const interactiveDataView = await mcpserverSearch.getSearchResults()

    const columnGroupSelector = await interactiveDataView?.getCustomGroupColumnSelector()
    expect(columnGroupSelector).toBeTruthy()

    await columnGroupSelector!.openCustomGroupColumnSelectorDialog()
    const pickList = await columnGroupSelector!.getPicklist()
    const transferControlButtons = await pickList.getTransferControlsButtons()
    expect(transferControlButtons).toHaveLength(4)

    // Currently, all columns are selected. Next, we are unselecting all to have a clean test setting.
    const deactivateAllColumnsButton = transferControlButtons[1]
    await deactivateAllColumnsButton.click()
    const inactiveItems = await pickList.getTargetListItems()
    await inactiveItems[0].selectItem()
    const activateCurrentColumnButton = transferControlButtons[2]
    await activateCurrentColumnButton.click()
    const saveButton = await columnGroupSelector!.getSaveButton()
    await saveButton.click()

    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MCPServerSearchActions.resultComponentStateChanged.type
      })
    )
  })

  it('should dispatch chartVisibilityToggled on show/hide chart header', async () => {
    jest.spyOn(store, 'dispatch')

    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      chartVisible: false
    })
    store.refreshState()

    const searchHeader = await mcpserverSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const showChartActionItem = await pageHeader.getOverFlowMenuItem('Show chart')
    await showChartActionItem!.selectItem()
    expect(store.dispatch).toHaveBeenCalledWith(MCPServerSearchActions.chartVisibilityToggled())
  })

  it('should display translated headers', async () => {
    const searchHeader = await mcpserverSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    expect(await pageHeader.getHeaderText()).toEqual('Tools (MCP) Search')
    expect(await pageHeader.getSubheaderText()).toEqual('Search and display Tools (MCP)')
  })

  it('should display translated empty message when no search results', async () => {
    const columns = [
      {
        columnType: ColumnType.STRING,
        id: 'name',
        nameKey: 'HELLO_SEARCH.RESULTS.HELLO',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
          'HELLO_SEARCH.PREDEFINED_GROUP.DEFAULT',
          'HELLO_SEARCH.PREDEFINED_GROUP.EXTENDED',
          'HELLO_SEARCH.PREDEFINED_GROUP.FULL'
        ]
      }
    ]
    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      results: [],
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const interactiveDataView = await mcpserverSearch.getSearchResults()
    const dataView = await interactiveDataView.getDataView()
    expect(dataView).toBeTruthy()
    expect(fixture.debugElement.query(By.css('.p-dataview-emptymessage'))).toBeDefined()
  })

  it('should not display chart when no results or toggled to not visible', async () => {
    component.diagramColumnId = 'name'

    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      results: [],
      chartVisible: true,
      columns: [
        {
          columnType: ColumnType.STRING,
          id: 'name',
          nameKey: 'HELLO_SEARCH.RESULTS.HELLO',
          filterable: true,
          sortable: true,
          predefinedGroupKeys: [
            'HELLO_SEARCH.PREDEFINED_GROUP.DEFAULT',
            'HELLO_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'HELLO_SEARCH.PREDEFINED_GROUP.FULL'
          ]
        }
      ]
    })
    store.refreshState()

    let diagram = await mcpserverSearch.getDiagram()
    expect(diagram).toBeNull()

    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      results: [
        {
          id: '1',
          imagePath: '',
          name: 'val_1'
        }
      ],
      chartVisible: false,
      columns: [
        {
          columnType: ColumnType.STRING,
          id: 'name',
          nameKey: 'HELLO_SEARCH.RESULTS.HELLO',
          filterable: true,
          sortable: true,
          predefinedGroupKeys: [
            'HELLO_SEARCH.PREDEFINED_GROUP.DEFAULT',
            'HELLO_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'HELLO_SEARCH.PREDEFINED_GROUP.FULL'
          ]
        }
      ]
    })
    store.refreshState()

    diagram = await mcpserverSearch.getDiagram()
    expect(diagram).toBeNull()

    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      results: [
        {
          id: '1',
          imagePath: '',
          name: 'val_1'
        }
      ],
      chartVisible: true,
      columns: [
        {
          columnType: ColumnType.STRING,
          id: 'name',
          nameKey: 'HELLO_SEARCH.RESULTS.HELLO',
          filterable: true,
          sortable: true,
          predefinedGroupKeys: [
            'HELLO_SEARCH.PREDEFINED_GROUP.DEFAULT',
            'HELLO_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'HELLO_SEARCH.PREDEFINED_GROUP.FULL'
          ]
        }
      ]
    })
    store.refreshState()

    diagram = await mcpserverSearch.getDiagram()
    expect(diagram).toBeTruthy()
  })

  it('should dispatch export csv data on export action click', async () => {
    jest.spyOn(store, 'dispatch')

    const results = [
      {
        id: '1',
        imagePath: '',
        name: 'val_1'
      }
    ]
    const columns = [
      {
        columnType: ColumnType.STRING,
        id: 'name',
        nameKey: 'HELLO_SEARCH.RESULTS.HELLO',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
          'HELLO_SEARCH.PREDEFINED_GROUP.DEFAULT',
          'HELLO_SEARCH.PREDEFINED_GROUP.EXTENDED',
          'HELLO_SEARCH.PREDEFINED_GROUP.FULL'
        ]
      }
    ]
    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      results: results,
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const searchHeader = await mcpserverSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const exportAllActionItem = await pageHeader.getOverFlowMenuItem('Export all')
    await exportAllActionItem!.selectItem()

    expect(store.dispatch).toHaveBeenCalledWith(MCPServerSearchActions.exportButtonClicked())
  })
})

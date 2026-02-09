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
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'
import {
  AlwaysGrantPermissionChecker,
  BreadcrumbService,
  ColumnType,
  DiagramType,
  HAS_PERMISSION_CHECKER,
  PortalCoreModule
} from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'
import { MCPServerSearchActions } from './mcpserver-search.actions'
import { mcpserverSearchColumns } from './mcpserver-search.columns'
import { MCPServerSearchComponent } from './mcpserver-search.component'
import { MCPServerSearchHarness } from './mcpserver-search.harness'
import { initialState } from './mcpserver-search.reducers'
import { selectMCPServerSearchViewModel } from './mcpserver-search.selectors'
import { MCPServerSearchViewModel } from './mcpserver-search.viewmodel'
import { getUTCDateWithoutTimezoneIssues } from '@onecx/accelerator'

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
        stopImmediatePropagation: () => { },
        stopPropagation: () => { }
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
      declarations: [MCPServerSearchComponent],
      imports: [
        PortalCoreModule,
        LetDirective,
        ReactiveFormsModule,
        StoreModule.forRoot({}),
        FormsModule,
        ReactiveFormsModule,
        TranslateTestingModule.withTranslations('en', require('./../../../../assets/i18n/en.json')).withTranslations(
          'de',
          require('./../../../../assets/i18n/de.json')
        ),
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
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
          changeMe: 'val_1'
        }
      ],
      columns: [
        {
          columnType: ColumnType.STRING,
          id: 'changeMe',
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

    const searchHeader = await mcpserverSearch.getHeader()
    await searchHeader.clickResetButton()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should have 2 overFlow header actions when search config is disabled', async () => {
    const searchHeader = await mcpserverSearch.getHeader()
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
    expect(overflowMenuItems.length).toBe(2)

    const showHideChartActionItem = await pageHeader.getOverFlowMenuItem('Hide chart')
    expect(await showHideChartActionItem!.getText()).toEqual('Hide chart')
  })

  it('should display chosen column in the diagram', async () => {
    component.diagramColumnId = 'changeMe'
    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      chartVisible: true,
      results: [
        {
          id: '1',
          imagePath: '',
          changeMe: 'val_1'
        },
        {
          id: '2',
          imagePath: '',
          changeMe: 'val_2'
        },
        {
          id: '3',
          imagePath: '',
          changeMe: 'val_2'
        }
      ],
      columns: [
        {
          columnType: ColumnType.STRING,
          id: 'changeMe',
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
    const breadcrumbService = TestBed.inject(BreadcrumbService)
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    const searchHeader = await mcpserverSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Search')

    expect(await searchBreadcrumbItem!.getText()).toEqual('Search')
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
        changeMe: 'val_1'
      }
    ]
    const columns = [
      {
        columnType: ColumnType.STRING,
        id: 'changeMe',
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
    const dataTable = await dataView.getDataListGrid()
    const editButtons = await dataTable!.getActionButtons('list')

    await editButtons[0].click()

    expect(store.dispatch).toHaveBeenCalledWith(
      MCPServerSearchActions.detailsButtonClicked({ id: '1' })
    )
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
        id: 'changeMe',
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
      ; (await (await interactiveDataView.getDataLayoutSelection()).getTableLayoutSelectionButton())?.click()

    const columnGroupSelector = await interactiveDataView?.getCustomGroupColumnSelector()
    expect(columnGroupSelector).toBeTruthy()

    await columnGroupSelector!.openCustomGroupColumnSelectorDialog()
    const pickList = await columnGroupSelector!.getPicklist()
    const transferControlButtons = await pickList.getTransferControlsButtons()
    expect(transferControlButtons.length).toBe(4)

    // Currently, all columns are selected. Next, we are unselecting all to have a clean test setting.
    const deactivateAllColumnsButton = transferControlButtons[1]
    await deactivateAllColumnsButton.click()
    const inactiveItems = await pickList.getTargetListItems()
    await inactiveItems[0].selectItem()
    const activateCurrentColumnButton = transferControlButtons[2]
    await activateCurrentColumnButton.click()
    const saveButton = await columnGroupSelector!.getSaveButton()
    await saveButton.click()

    expect(store.dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ displayedColumns: columns }))
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
    expect(await pageHeader.getHeaderText()).toEqual('MCPServer Search')
    expect(await pageHeader.getSubheaderText()).toEqual('Searching and displaying of MCPServer')
  })

  it('should display translated empty message when no search results', async () => {
    const columns = [
      {
        columnType: ColumnType.STRING,
        id: 'changeMe',
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
    const dataTable = await dataView.getDataListGrid()
    const rows = await dataTable!.getActionButtons('list')
    expect(rows.length).toBe(0)
    expect(fixture.debugElement.query(By.css('.p-dataview-emptymessage'))).toBeDefined()
  })

  it('should not display chart when no results or toggled to not visible', async () => {
    component.diagramColumnId = 'changeMe'

    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      results: [],
      chartVisible: true,
      columns: [
        {
          columnType: ColumnType.STRING,
          id: 'changeMe',
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
          changeMe: 'val_1'
        }
      ],
      chartVisible: false,
      columns: [
        {
          columnType: ColumnType.STRING,
          id: 'changeMe',
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
          changeMe: 'val_1'
        }
      ],
      chartVisible: true,
      columns: [
        {
          columnType: ColumnType.STRING,
          id: 'changeMe',
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
        changeMe: 'val_1'
      }
    ]
    const columns = [
      {
        columnType: ColumnType.STRING,
        id: 'changeMe',
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

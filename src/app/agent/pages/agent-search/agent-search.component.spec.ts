import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { RowListGridData } from '@onecx/angular-accelerator'

import { provideHttpClient } from '@angular/common/http'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store, StoreModule } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import {
  AngularAcceleratorModule,
  BreadcrumbService,
  ColumnType,
  providePortalDialogService
} from '@onecx/angular-accelerator'
import { UserService } from '@onecx/angular-integration-interface'
import { provideUserServiceMock, UserServiceMock } from '@onecx/angular-integration-interface/mocks'
import {
  HAS_PERMISSION_CHECKER,
  PermissionService,
  PortalPageComponent,
  TranslationConnectionService
} from '@onecx/angular-utils'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'

import { agentSearchActions } from './agent-search.actions'
import { agentSearchColumns } from './agent-search.columns'
import { AgentSearchComponent } from './agent-search.component'
import { AgentSearchHarness } from './agent-search.harness'
import { initialState } from './agent-search.reducers'
import { selectAgentSearchViewModel } from './agent-search.selectors'
import { AgentSearchViewModel } from './agent-search.viewmodel'

describe('AgentSearchComponent', () => {
  const origAddEventListener = window.addEventListener
  const origPostMessage = window.postMessage

  let listeners: unknown[] = []
  window.addEventListener = (_type: unknown, listener: unknown) => {
    listeners.push(listener)
  }

  window.removeEventListener = (_type: unknown, listener: unknown) => {
    listeners = listeners.filter((l) => l !== listener)
  }

  window.postMessage = (m: unknown) => {
    listeners.forEach((l) =>
      (l as (event: { data: unknown; stopImmediatePropagation: () => void; stopPropagation: () => void }) => void)({
        data: m,
        stopImmediatePropagation: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
        stopPropagation: () => {} // eslint-disable-line @typescript-eslint/no-empty-function
      })
    )
  }

  afterAll(() => {
    window.addEventListener = origAddEventListener
    window.postMessage = origPostMessage
  })

  HTMLCanvasElement.prototype.getContext = jest.fn()
  let component: AgentSearchComponent
  let fixture: ComponentFixture<AgentSearchComponent>
  let store: MockStore<Store>
  let formBuilder: FormBuilder
  let agentSearch: AgentSearchHarness

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  // ACTION S11: Change test data in the whole document
  const baseAgentSearchViewModel: AgentSearchViewModel = {
    columns: agentSearchColumns,
    searchCriteria: { name: '0' },
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
      declarations: [AgentSearchComponent],
      imports: [
        AngularAcceleratorModule,
        PortalPageComponent,
        LetDirective,
        ReactiveFormsModule,
        TooltipModule,
        FloatLabelModule,
        InputTextModule,
        StoreModule.forRoot({}),
        TranslateTestingModule.withTranslations({
          de: require('./src/assets/i18n/de.json'),
          en: require('./src/assets/i18n/en.json')
        }).withDefaultLanguage('en'),
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DialogService,
        PermissionService,
        provideMockStore({
          initialState: { agent: { search: initialState } }
        }),
        FormBuilder,
        provideUserServiceMock(),
        {
          provide: HAS_PERMISSION_CHECKER,
          useExisting: UserService
        },
        providePortalDialogService(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: TranslationConnectionService,
          useValue: { init: jest.fn(), destroy: jest.fn() }
        }
      ]
    }).compileComponents()
  })

  beforeEach(async () => {
    const userService = TestBed.inject(UserServiceMock)
    userService.permissionsTopic$.publish([
      'AGENT#CREATE',
      'AGENT#EDIT',
      'AGENT#DELETE',
      'AGENT#IMPORT',
      'AGENT#EXPORT',
      'AGENT#VIEW',
      'AGENT#SEARCH'
    ])

    formBuilder = TestBed.inject(FormBuilder)
    store = TestBed.inject(MockStore)
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectAgentSearchViewModel, baseAgentSearchViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(AgentSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    agentSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, AgentSearchHarness)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should dispatch resetButtonClicked action on resetSearch', (done) => {
    store.scannedActions$.pipe(ofType(agentSearchActions.resetButtonClicked)).subscribe(() => {
      expect(store.dispatch).toHaveBeenCalledWith(agentSearchActions.resetButtonClicked())
      done()
    })

    component.resetSearch()
  })

  it('should have 2 overFlow header actions when search config is disabled', async () => {
    const searchHeader = await agentSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const overflowMenuItems = await pageHeader.getOverFlowMenuItems()
    expect(overflowMenuItems).toHaveLength(2)

    const exportAllActionItem = await pageHeader.getOverFlowMenuItem('Export all')
    expect(exportAllActionItem).not.toBeNull()
    if (exportAllActionItem) expect(await exportAllActionItem.getText()).toBe('Export all')

    const showHideChartActionItem = await pageHeader.getOverFlowMenuItem('Show chart')
    expect(showHideChartActionItem).not.toBeNull()
    if (showHideChartActionItem) expect(await showHideChartActionItem.getText()).toBe('Show chart')
  })

  it('should display hide chart action if chart is visible', async () => {
    store.overrideSelector(selectAgentSearchViewModel, {
      ...baseAgentSearchViewModel,
      chartVisible: true
    })
    store.refreshState()

    const searchHeader = await agentSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const overflowMenuItems = await pageHeader.getOverFlowMenuItems()
    expect(overflowMenuItems).toHaveLength(2)

    const showHideChartActionItem = await pageHeader.getOverFlowMenuItem('Hide chart')
    expect(showHideChartActionItem).not.toBeNull()
    if (showHideChartActionItem) expect(await showHideChartActionItem.getText()).toEqual('Hide chart')
  })

  it('should display chosen column in the diagram', async () => {
    component.diagramColumnId = 'name'
    store.overrideSelector(selectAgentSearchViewModel, {
      ...baseAgentSearchViewModel,
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
          nameKey: 'AGENT_SEARCH.RESULTS.CHANGE_ME',
          filterable: true,
          sortable: true,
          predefinedGroupKeys: [
            'AGENT_SEARCH.PREDEFINED_GROUP.DEFAULT',
            'AGENT_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'AGENT_SEARCH.PREDEFINED_GROUP.FULL'
          ]
        }
      ]
    })
    store.refreshState()

    const diagram = await (await agentSearch.getDiagram())?.getDiagram()
    if (diagram) {
      expect(await diagram.getTotalNumberOfResults()).toBe(3)
      expect(await diagram.getSumLabel()).toEqual('Total')
    }
  })

  it('should display correct breadcrumbs', async () => {
    const breadcrumbService = TestBed.inject(BreadcrumbService)
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    const searchHeader = await agentSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Search')

    if (searchBreadcrumbItem) expect(await searchBreadcrumbItem.getText()).toEqual('Search')
  })

  it('should dispatch searchButtonClicked action on search', (done) => {
    const formValue = formBuilder.group({
      name: '123'
    })
    component.agentSearchFormGroup = formValue

    store.scannedActions$.pipe(ofType(agentSearchActions.searchButtonClicked)).subscribe((a) => {
      expect(a.searchCriteria).toEqual({ name: '123' })
      done()
    })

    component.search(formValue)
  })

  it('should dispatch viewModeChanged action on view mode changes', async () => {
    jest.spyOn(store, 'dispatch')

    component.searchHeaderComponentStateChanged({ activeViewMode: 'advanced' })

    expect(store.dispatch).toHaveBeenCalledWith(
      agentSearchActions.searchHeaderComponentStateChanged({
        activeViewMode: 'advanced'
      })
    )
  })

  it('should dispatch displayedColumnsChanged on data view column change', async () => {
    jest.spyOn(store, 'dispatch')
    const columns = [
      {
        columnType: ColumnType.STRING,
        id: 'name',
        nameKey: 'AGENT_SEARCH.RESULTS.CHANGE_ME',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
          'AGENT_SEARCH.PREDEFINED_GROUP.DEFAULT',
          'AGENT_SEARCH.PREDEFINED_GROUP.EXTENDED',
          'AGENT_SEARCH.PREDEFINED_GROUP.FULL'
        ]
      }
    ]
    store.overrideSelector(selectAgentSearchViewModel, {
      ...baseAgentSearchViewModel,
      results: [],
      columns: columns,
      resultComponentState: { layout: 'table' }
    })
    store.refreshState()

    const interactiveDataView = await agentSearch.getSearchResults()
    const columnGroupSelector = await interactiveDataView?.getCustomGroupColumnSelector()
    expect(columnGroupSelector).toBeTruthy()

    if (columnGroupSelector) {
      await columnGroupSelector.openCustomGroupColumnSelectorDialog()
      const pickList = await columnGroupSelector.getPicklist()
      const transferControlButtons = await pickList.getTransferControlsButtons()
      expect(transferControlButtons).toHaveLength(4)

      // Currently, all columns are selected. Next, we are unselecting all to have a clean test setting.
      const deactivateAllColumnsButton = transferControlButtons[1]
      await deactivateAllColumnsButton.click()
      const inactiveItems = await pickList.getTargetListItems()
      await inactiveItems[0].selectItem()
      const activateCurrentColumnButton = transferControlButtons[2]
      await activateCurrentColumnButton.click()
      const saveButton = await columnGroupSelector.getSaveButton()
      await saveButton.click()

      expect(store.dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ displayedColumns: columns }))
    }
  })

  it('should dispatch chartVisibilityToggled on show/hide chart header', async () => {
    jest.spyOn(store, 'dispatch')

    store.overrideSelector(selectAgentSearchViewModel, {
      ...baseAgentSearchViewModel,
      chartVisible: false
    })
    store.refreshState()

    const searchHeader = await agentSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const showChartActionItem = await pageHeader.getOverFlowMenuItem('Show chart')
    if (showChartActionItem) {
      await showChartActionItem.selectItem()
      expect(store.dispatch).toHaveBeenCalledWith(agentSearchActions.chartVisibilityToggled())
    }
  })

  it('should display translated headers', async () => {
    const searchHeader = await agentSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    expect(await pageHeader.getHeaderText()).toEqual('Agent Search')
    expect(await pageHeader.getSubheaderText()).toEqual('Searching and displaying of Agents')
  })

  it('should display translated empty message when no search results', async () => {
    const columns = [
      {
        columnType: ColumnType.STRING,
        id: 'name',
        nameKey: 'AGENT_SEARCH.RESULTS.CHANGE_ME',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
          'AGENT_SEARCH.PREDEFINED_GROUP.DEFAULT',
          'AGENT_SEARCH.PREDEFINED_GROUP.EXTENDED',
          'AGENT_SEARCH.PREDEFINED_GROUP.FULL'
        ]
      }
    ]
    store.overrideSelector(selectAgentSearchViewModel, {
      ...baseAgentSearchViewModel,
      results: [],
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const interactiveDataView = await agentSearch.getSearchResults()
    expect(interactiveDataView).toBeTruthy()
    expect(fixture.nativeElement.textContent).toContain('No results.')
  })

  it('should not display chart when no results or toggled to not visible', async () => {
    component.diagramColumnId = 'name'

    store.overrideSelector(selectAgentSearchViewModel, {
      ...baseAgentSearchViewModel,
      results: [],
      chartVisible: true,
      columns: [
        {
          columnType: ColumnType.STRING,
          id: 'name',
          nameKey: 'AGENT_SEARCH.RESULTS.CHANGE_ME',
          filterable: true,
          sortable: true,
          predefinedGroupKeys: [
            'AGENT_SEARCH.PREDEFINED_GROUP.DEFAULT',
            'AGENT_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'AGENT_SEARCH.PREDEFINED_GROUP.FULL'
          ]
        }
      ]
    })
    store.refreshState()
    fixture.detectChanges()

    let diagram = await agentSearch.getDiagram()
    expect(diagram).toBeNull()

    store.overrideSelector(selectAgentSearchViewModel, {
      ...baseAgentSearchViewModel,
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
          nameKey: 'AGENT_SEARCH.RESULTS.CHANGE_ME',
          filterable: true,
          sortable: true,
          predefinedGroupKeys: [
            'AGENT_SEARCH.PREDEFINED_GROUP.DEFAULT',
            'AGENT_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'AGENT_SEARCH.PREDEFINED_GROUP.FULL'
          ]
        }
      ]
    })
    store.refreshState()
    fixture.detectChanges()

    diagram = await agentSearch.getDiagram()
    expect(diagram).toBeNull()

    store.overrideSelector(selectAgentSearchViewModel, {
      ...baseAgentSearchViewModel,
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
          nameKey: 'AGENT_SEARCH.RESULTS.CHANGE_ME',
          filterable: true,
          sortable: true,
          predefinedGroupKeys: [
            'AGENT_SEARCH.PREDEFINED_GROUP.DEFAULT',
            'AGENT_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'AGENT_SEARCH.PREDEFINED_GROUP.FULL'
          ]
        }
      ]
    })
    store.refreshState()
    fixture.detectChanges()

    diagram = await agentSearch.getDiagram()
    expect(diagram).toBeTruthy()
  })

  it('should export csv data on export action click', async () => {
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
        nameKey: 'AGENT_SEARCH.RESULTS.CHANGE_ME',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
          'AGENT_SEARCH.PREDEFINED_GROUP.DEFAULT',
          'AGENT_SEARCH.PREDEFINED_GROUP.EXTENDED',
          'AGENT_SEARCH.PREDEFINED_GROUP.FULL'
        ]
      }
    ]
    store.overrideSelector(selectAgentSearchViewModel, {
      ...baseAgentSearchViewModel,
      results: results,
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const searchHeader = await agentSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const exportAllActionItem = await pageHeader.getOverFlowMenuItem('Export all')
    if (exportAllActionItem) await exportAllActionItem.selectItem()

    expect(store.dispatch).toHaveBeenCalledWith(agentSearchActions.exportButtonClicked())
  })

  describe('searchCriteria mapping', () => {
    const cases = [
      {
        desc: 'should convert Date values to UTC and dispatch searchButtonClicked',
        formValue: { name: new Date(2024, 4, 15) },
        expected: { name: new Date(Date.UTC(2024, 4, 15)) }
      },
      {
        desc: 'should pass through non-date, non-empty values unchanged',
        formValue: { name: 'testName' },
        expected: { name: 'testName' }
      },
      {
        desc: 'should set searchCriteria property to undefined for null values',
        formValue: { name: null },
        expected: { name: undefined }
      }
    ]

    cases.forEach(({ desc, formValue, expected }) => {
      it(desc, () => {
        jest.spyOn(store, 'dispatch')

        component.agentSearchFormGroup = {
          value: formValue,
          getRawValue: () => formValue
        } as unknown as FormGroup

        component.search(component.agentSearchFormGroup)

        const calls = (store.dispatch as jest.Mock).mock.calls
        expect(calls.length).toBeGreaterThan(0)
        const lastAction = calls[calls.length - 1][0]
        expect(lastAction.type).toBe(agentSearchActions.searchButtonClicked.type)
        expect(lastAction.searchCriteria).toEqual(expected)
      })
    })
  })

  describe('actions dispatch', () => {
    const cases = [
      {
        method: 'resultComponentStateChanged',
        action: agentSearchActions.resultComponentStateChanged,
        payload: { groupKey: 'test-group' }
      },
      {
        method: 'searchHeaderComponentStateChanged',
        action: agentSearchActions.searchHeaderComponentStateChanged,
        payload: { activeViewMode: 'basic' as 'basic' | 'advanced', selectedSearchConfig: 'config1' }
      },
      {
        method: 'diagramComponentStateChanged',
        action: agentSearchActions.diagramComponentStateChanged,
        payload: { label: 'Test Diagram' }
      }
    ]

    cases.forEach(({ method, action, payload }) => {
      it(`should dispatch ${action.type} when ${method} is called`, () => {
        jest.spyOn(store, 'dispatch')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(component as any)[method](payload)

        expect(store.dispatch).toHaveBeenCalledWith(action(payload))
      })
    })
  })

  it('should dispatch detailsButtonClicked action on details', () => {
    jest.spyOn(store, 'dispatch')
    const row: RowListGridData = { id: 'test-id', imagePath: '' }
    component.details(row)
    expect(store.dispatch).toHaveBeenCalledWith(agentSearchActions.detailsButtonClicked({ id: 'test-id' }))
  })
  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>
})

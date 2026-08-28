import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store, StoreModule } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'
import { firstValueFrom } from 'rxjs'

import { AngularAcceleratorModule, ColumnType, DiagramType } from '@onecx/angular-accelerator'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'
import { AlwaysGrantPermissionChecker, HAS_PERMISSION_CHECKER, providePermissionService } from '@onecx/angular-utils'

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
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        stopImmediatePropagation: () => {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
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
        NoopAnimationsModule
      ],
      providers: [
        ...providePermissionService(),
        provideHttpClient(),
        provideHttpClientTesting(),
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
    await TestbedHarnessEnvironment.harnessForFixture(fixture, MCPServerSearchHarness)
    fixture.detectChanges()
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
    const actions = await firstValueFrom(component.headerActions$)
    const overflowActions = actions.filter((a) => a.show === 'asOverflow')
    expect(overflowActions).toHaveLength(2)
    const exportAllActionItem = overflowActions.find((a) => a.labelKey === 'MCPSERVER_SEARCH.HEADER_ACTIONS.EXPORT_ALL')
    expect(exportAllActionItem).toBeDefined()
    const showHideChartActionItem = overflowActions.find(
      (a) => a.labelKey === 'MCPSERVER_SEARCH.HEADER_ACTIONS.SHOW_CHART'
    )
    expect(showHideChartActionItem).toBeDefined()
  })

  it('should display hide chart action if chart is visible', async () => {
    store.overrideSelector(selectMCPServerSearchViewModel, { ...baseMCPServerSearchViewModel, chartVisible: true })
    store.refreshState()
    const actions = await firstValueFrom(component.headerActions$)
    const overflowActions = actions.filter((a) => a.show === 'asOverflow')
    expect(overflowActions).toHaveLength(2)
    const hideChartAction = overflowActions.find((a) => a.labelKey === 'MCPSERVER_SEARCH.HEADER_ACTIONS.HIDE_CHART')
    expect(hideChartAction).toBeDefined()
  })

  it('should display chosen column in the diagram', async () => {
    component.diagramColumnId = 'name'
    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      chartVisible: true,
      results: [
        { id: '1', imagePath: '', name: 'val_1' },
        { id: '2', imagePath: '', name: 'val_2' },
        { id: '3', imagePath: '', name: 'val_2' }
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
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()

    const diagram = fixture.nativeElement.querySelector('ocx-group-by-count-diagram')
    expect(diagram).toBeTruthy()
  })

  it('should display correct breadcrumbs', () => {
    const breadcrumbService = component['breadcrumbService']
    jest.spyOn(breadcrumbService, 'setItems')
    component.ngOnInit()
    fixture.detectChanges()
    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    expect(breadcrumbService.setItems).toHaveBeenCalledWith([
      { titleKey: 'MCPSERVER_SEARCH.BREADCRUMB', labelKey: 'MCPSERVER_SEARCH.BREADCRUMB', routerLink: '/mcpserver' }
    ])
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
          description: new Date(Date.UTC(2024, 5, 1))
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

  it('should dispatch detailsButtonClicked action on details clicked', () => {
    jest.spyOn(store, 'dispatch')
    component.details({ id: '1', imagePath: '' })
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

  it('should dispatch displayedColumnsChanged on data view column change', () => {
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
    component.resultComponentStateChanged({ layout: 'table', displayedColumns: columns } as any)
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: MCPServerSearchActions.resultComponentStateChanged.type })
    )
  })

  it('should dispatch chartVisibilityToggled on show/hide chart header', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectMCPServerSearchViewModel, { ...baseMCPServerSearchViewModel, chartVisible: false })
    store.refreshState()
    const actions = await firstValueFrom(component.headerActions$)
    const showChartAction = actions.find((a) => a.labelKey === 'MCPSERVER_SEARCH.HEADER_ACTIONS.SHOW_CHART')
    expect(showChartAction).toBeTruthy()
    showChartAction?.actionCallback?.()
    expect(store.dispatch).toHaveBeenCalledWith(MCPServerSearchActions.chartVisibilityToggled())
  })

  it('should display translated headers', async () => {
    fixture.detectChanges()
    await fixture.whenStable()
    const pageContent = fixture.nativeElement.textContent
    expect(pageContent).toContain('Tools (MCP) Search')
    expect(pageContent).toContain('Search and display Tools (MCP)')
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
      columns,
      displayedColumns: columns
    })
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('No results.')
  })

  it('should not display chart when no results or toggled to not visible', async () => {
    component.diagramColumnId = 'name'
    const col = {
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

    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      results: [],
      chartVisible: true,
      columns: [col]
    })
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('ocx-group-by-count-diagram')).toBeNull()

    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      results: [{ id: '1', imagePath: '', name: 'val_1' }],
      chartVisible: false,
      columns: [col]
    })
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('ocx-group-by-count-diagram')).toBeNull()

    store.overrideSelector(selectMCPServerSearchViewModel, {
      ...baseMCPServerSearchViewModel,
      results: [{ id: '1', imagePath: '', name: 'val_1' }],
      chartVisible: true,
      columns: [col]
    })
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('ocx-group-by-count-diagram')).toBeTruthy()
  })

  it('should dispatch export csv data on export action click', async () => {
    jest.spyOn(store, 'dispatch')
    const actions = await firstValueFrom(component.headerActions$)
    const exportAction = actions.find((a) => a.labelKey === 'MCPSERVER_SEARCH.HEADER_ACTIONS.EXPORT_ALL')
    expect(exportAction).toBeTruthy()
    exportAction?.actionCallback?.()
    expect(store.dispatch).toHaveBeenCalledWith(MCPServerSearchActions.exportButtonClicked())
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
        desc: 'should pass through null values unchanged',
        formValue: { name: null },
        expected: { name: null }
      }
    ]

    cases.forEach(({ desc, formValue, expected }) => {
      it(desc, () => {
        jest.spyOn(store, 'dispatch')

        component.mcpserverSearchFormGroup = {
          value: formValue,
          getRawValue: () => formValue
        } as unknown as FormGroup

        component.search(component.mcpserverSearchFormGroup)

        const calls = (store.dispatch as jest.Mock).mock.calls
        expect(calls.length).toBeGreaterThan(0)
        const lastAction = calls[calls.length - 1][0]
        expect(lastAction.type).toBe(MCPServerSearchActions.searchButtonClicked.type)
        expect(lastAction.searchCriteria).toEqual(expected)
      })
    })
  })

  it('should dispatch createMcpserverButtonClicked action on create()', () => {
    jest.spyOn(store, 'dispatch')
    component.create()
    expect(store.dispatch).toHaveBeenCalledWith(MCPServerSearchActions.createMcpserverButtonClicked())
  })

  it('should dispatch editMcpserverButtonClicked action on edit()', () => {
    jest.spyOn(store, 'dispatch')
    const row = { id: 'test-id', imagePath: '' }
    component.edit(row)
    expect(store.dispatch).toHaveBeenCalledWith(MCPServerSearchActions.editMcpserverButtonClicked({ id: 'test-id' }))
  })

  it('should call create() when headerActions$ actionCallback is triggered', (done) => {
    jest.spyOn(component, 'create')
    jest.spyOn(store, 'dispatch')

    component.headerActions$.subscribe((actions) => {
      const createAction = actions.find((a) => a.labelKey === 'MCPSERVER_CREATE_UPDATE.ACTION.CREATE')
      createAction?.actionCallback?.()

      expect(component.create).toHaveBeenCalled()
      expect(store.dispatch).toHaveBeenCalledWith(MCPServerSearchActions.createMcpserverButtonClicked())
      done()
    })
  })
})

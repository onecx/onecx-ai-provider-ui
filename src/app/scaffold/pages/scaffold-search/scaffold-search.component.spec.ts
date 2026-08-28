import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store, StoreModule } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { firstValueFrom } from 'rxjs'

import { DialogService } from 'primeng/dynamicdialog'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'

import { UserService } from '@onecx/angular-integration-interface'
import { provideUserServiceMock, UserServiceMock } from '@onecx/angular-integration-interface/mocks'
import {
  AngularAcceleratorModule,
  BreadcrumbService,
  ColumnType,
  providePortalDialogService,
  RowListGridData
} from '@onecx/angular-accelerator'
import {
  HAS_PERMISSION_CHECKER,
  PermissionService,
  PortalPageComponent,
  TranslationConnectionService
} from '@onecx/angular-utils'

import { scaffoldSearchActions } from './scaffold-search.actions'
import { scaffoldSearchColumns } from './scaffold-search.columns'
import { ScaffoldSearchComponent } from './scaffold-search.component'
import { ScaffoldSearchHarness } from './scaffold-search.harness'
import { initialState } from './scaffold-search.reducers'
import { selectScaffoldSearchViewModel } from './scaffold-search.selectors'
import { ScaffoldSearchViewModel } from './scaffold-search.viewmodel'

describe('ScaffoldSearchComponent', () => {
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
  let component: ScaffoldSearchComponent
  let fixture: ComponentFixture<ScaffoldSearchComponent>
  let store: MockStore<Store>
  let formBuilder: FormBuilder

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  // ACTION S11: Change test data in the whole document
  const baseScaffoldSearchViewModel: ScaffoldSearchViewModel = {
    columns: scaffoldSearchColumns,
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
      imports: [
        ScaffoldSearchComponent,
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
          initialState: { scaffold: { search: initialState } }
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
      'SCAFFOLD#CREATE',
      'SCAFFOLD#EDIT',
      'SCAFFOLD#DELETE',
      'SCAFFOLD#IMPORT',
      'SCAFFOLD#EXPORT',
      'SCAFFOLD#VIEW',
      'SCAFFOLD#SEARCH'
    ])

    formBuilder = TestBed.inject(FormBuilder)
    store = TestBed.inject(MockStore)
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectScaffoldSearchViewModel, baseScaffoldSearchViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(ScaffoldSearchComponent)
    component = fixture.componentInstance
    await TestbedHarnessEnvironment.harnessForFixture(fixture, ScaffoldSearchHarness)
    fixture.detectChanges()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should dispatch resetButtonClicked action on resetSearch', (done) => {
    store.scannedActions$.pipe(ofType(scaffoldSearchActions.resetButtonClicked)).subscribe(() => {
      expect(store.dispatch).toHaveBeenCalledWith(scaffoldSearchActions.resetButtonClicked())
      done()
    })

    component.resetSearch()
  })

  it('should have 2 overFlow header actions when search config is disabled', async () => {
    const actions = await firstValueFrom(component.headerActions$)
    const overflowActions = actions.filter((a) => a.show === 'asOverflow')
    expect(overflowActions).toHaveLength(2)
    const exportAllActionItem = overflowActions.find((a) => a.labelKey === 'SCAFFOLD_SEARCH.HEADER_ACTIONS.EXPORT_ALL')
    expect(exportAllActionItem).not.toBeNull()
    const showHideChartActionItem = overflowActions.find(
      (a) => a.labelKey === 'SCAFFOLD_SEARCH.HEADER_ACTIONS.SHOW_CHART'
    )
    expect(showHideChartActionItem).not.toBeNull()
  })

  it('should display hide chart action if chart is visible', async () => {
    store.overrideSelector(selectScaffoldSearchViewModel, { ...baseScaffoldSearchViewModel, chartVisible: true })
    store.refreshState()
    const actions = await firstValueFrom(component.headerActions$)
    const overflowActions = actions.filter((a) => a.show === 'asOverflow')
    expect(overflowActions).toHaveLength(2)
    const hideChartAction = overflowActions.find((a) => a.labelKey === 'SCAFFOLD_SEARCH.HEADER_ACTIONS.HIDE_CHART')
    expect(hideChartAction).not.toBeNull()
  })

  it('should display chosen column in the diagram', async () => {
    component.diagramColumnId = 'source'
    store.overrideSelector(selectScaffoldSearchViewModel, {
      ...baseScaffoldSearchViewModel,
      chartVisible: true,
      results: [
        { id: '1', imagePath: '', source: 'val_1' },
        { id: '2', imagePath: '', source: 'val_2' },
        { id: '3', imagePath: '', source: 'val_2' }
      ],
      columns: [
        {
          columnType: ColumnType.STRING,
          id: 'source',
          nameKey: 'SCAFFOLD_SEARCH.RESULTS.NAME',
          filterable: true,
          sortable: true,
          predefinedGroupKeys: [
            'SCAFFOLD_SEARCH.PREDEFINED_GROUP.DEFAULT',
            'SCAFFOLD_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'SCAFFOLD_SEARCH.PREDEFINED_GROUP.FULL'
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
    const breadcrumbService = component['breadcrumbService'] as BreadcrumbService
    const spy = jest.spyOn(breadcrumbService, 'setItems')
    component.ngOnInit()
    fixture.detectChanges()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith([
      { titleKey: 'SCAFFOLD_SEARCH.BREADCRUMB', labelKey: 'SCAFFOLD_SEARCH.BREADCRUMB', routerLink: '/scaffold' }
    ])
  })

  it('should dispatch searchButtonClicked action on search', (done) => {
    const formValue = formBuilder.group({
      name: '123'
    })
    component.scaffoldSearchFormGroup = formValue

    store.scannedActions$.pipe(ofType(scaffoldSearchActions.searchButtonClicked)).subscribe((a) => {
      expect(a.searchCriteria).toEqual({ name: '123' })
      done()
    })

    component.search(formValue)
  })

  it('should dispatch viewModeChanged action on view mode changes', async () => {
    jest.spyOn(store, 'dispatch')

    component.searchHeaderComponentStateChanged({ activeViewMode: 'advanced' })

    expect(store.dispatch).toHaveBeenCalledWith(
      scaffoldSearchActions.searchHeaderComponentStateChanged({
        activeViewMode: 'advanced'
      })
    )
  })

  it('should dispatch displayedColumnsChanged on data view column change', () => {
    jest.spyOn(store, 'dispatch')
    const columns = [
      {
        columnType: ColumnType.STRING,
        id: 'source',
        nameKey: 'SCAFFOLD_SEARCH.RESULTS.SOURCE',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
          'SCAFFOLD_SEARCH.PREDEFINED_GROUP.DEFAULT',
          'SCAFFOLD_SEARCH.PREDEFINED_GROUP.EXTENDED',
          'SCAFFOLD_SEARCH.PREDEFINED_GROUP.FULL'
        ]
      }
    ]
    component.resultComponentStateChanged({ layout: 'table', displayedColumns: columns } as any)
    expect(store.dispatch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: scaffoldSearchActions.resultComponentStateChanged.type,
        displayedColumns: expect.any(Array)
      })
    )
  })

  it('should dispatch chartVisibilityToggled on show/hide chart header', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectScaffoldSearchViewModel, { ...baseScaffoldSearchViewModel, chartVisible: false })
    store.refreshState()
    const actions = await firstValueFrom(component.headerActions$)
    const showChartAction = actions.find((a) => a.labelKey === 'SCAFFOLD_SEARCH.HEADER_ACTIONS.SHOW_CHART')
    expect(showChartAction).toBeTruthy()
    showChartAction?.actionCallback?.()
    expect(store.dispatch).toHaveBeenCalledWith(scaffoldSearchActions.chartVisibilityToggled())
  })

  it('should display translated headers', async () => {
    fixture.detectChanges()
    await fixture.whenStable()
    const pageContent = fixture.nativeElement.textContent
    expect(pageContent).toContain('Scaffold Search')
    expect(pageContent).toContain('Searching and displaying of Scaffolds')
  })

  it('should display translated empty message when no search results', async () => {
    const columns = [
      {
        columnType: ColumnType.STRING,
        id: 'source',
        nameKey: 'SCAFFOLD_SEARCH.RESULTS.SOURCE',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
          'SCAFFOLD_SEARCH.PREDEFINED_GROUP.DEFAULT',
          'SCAFFOLD_SEARCH.PREDEFINED_GROUP.EXTENDED',
          'SCAFFOLD_SEARCH.PREDEFINED_GROUP.FULL'
        ]
      }
    ]
    store.overrideSelector(selectScaffoldSearchViewModel, {
      ...baseScaffoldSearchViewModel,
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
    component.diagramColumnId = 'source'
    const col = {
      columnType: ColumnType.STRING,
      id: 'source',
      nameKey: 'SCAFFOLD_SEARCH.RESULTS.SOURCE',
      filterable: true,
      sortable: true,
      predefinedGroupKeys: [
        'SCAFFOLD_SEARCH.PREDEFINED_GROUP.DEFAULT',
        'SCAFFOLD_SEARCH.PREDEFINED_GROUP.EXTENDED',
        'SCAFFOLD_SEARCH.PREDEFINED_GROUP.FULL'
      ]
    }

    store.overrideSelector(selectScaffoldSearchViewModel, {
      ...baseScaffoldSearchViewModel,
      results: [],
      chartVisible: true,
      columns: [col]
    })
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('ocx-group-by-count-diagram')).toBeNull()

    store.overrideSelector(selectScaffoldSearchViewModel, {
      ...baseScaffoldSearchViewModel,
      results: [{ id: '1', imagePath: '', source: 'val_1' }],
      chartVisible: false,
      columns: [col]
    })
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('ocx-group-by-count-diagram')).toBeNull()

    store.overrideSelector(selectScaffoldSearchViewModel, {
      ...baseScaffoldSearchViewModel,
      results: [{ id: '1', imagePath: '', source: 'val_1' }],
      chartVisible: true,
      columns: [col]
    })
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('ocx-group-by-count-diagram')).toBeTruthy()
  })

  it('should export csv data on export action click', async () => {
    jest.spyOn(store, 'dispatch')
    const actions = await firstValueFrom(component.headerActions$)
    const exportAction = actions.find((a) => a.labelKey === 'SCAFFOLD_SEARCH.HEADER_ACTIONS.EXPORT_ALL')
    expect(exportAction).toBeTruthy()
    exportAction?.actionCallback?.()
    expect(store.dispatch).toHaveBeenCalledWith(scaffoldSearchActions.exportButtonClicked())
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

        component.scaffoldSearchFormGroup = {
          value: formValue,
          getRawValue: () => formValue
        } as unknown as FormGroup

        component.search(component.scaffoldSearchFormGroup)

        const calls = (store.dispatch as jest.Mock).mock.calls
        expect(calls.length).toBeGreaterThan(0)
        const lastAction = calls[calls.length - 1][0]
        expect(lastAction.type).toBe(scaffoldSearchActions.searchButtonClicked.type)
        expect(lastAction.searchCriteria).toEqual(expected)
      })
    })
  })

  describe('actions dispatch', () => {
    const cases = [
      {
        method: 'resultComponentStateChanged',
        action: scaffoldSearchActions.resultComponentStateChanged,
        payload: { groupKey: 'test-group' }
      },
      {
        method: 'searchHeaderComponentStateChanged',
        action: scaffoldSearchActions.searchHeaderComponentStateChanged,
        payload: { activeViewMode: 'basic' as 'basic' | 'advanced', selectedSearchConfig: 'config1' }
      },
      {
        method: 'diagramComponentStateChanged',
        action: scaffoldSearchActions.diagramComponentStateChanged,
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
    expect(store.dispatch).toHaveBeenCalledWith(scaffoldSearchActions.detailsButtonClicked({ id: 'test-id' }))
  })

  it('should dispatch createScaffoldButtonClicked action on create()', () => {
    jest.spyOn(store, 'dispatch')
    component.create()
    expect(store.dispatch).toHaveBeenCalledWith(scaffoldSearchActions.createScaffoldButtonClicked())
  })

  it('should dispatch editScaffoldButtonClicked action on edit()', () => {
    jest.spyOn(store, 'dispatch')
    component.edit({ id: '123', imagePath: '' })
    expect(store.dispatch).toHaveBeenCalledWith(scaffoldSearchActions.editScaffoldButtonClicked({ id: '123' }))
  })

  it('should call create() when headerActions$ actionCallback is triggered', (done) => {
    const createSpy = jest.spyOn(component, 'create')

    component.headerActions$.subscribe((actions) => {
      const createAction = actions.find((a) => a.labelKey === 'SCAFFOLD_CREATE_UPDATE.ACTION.CREATE')
      const callback = createAction?.actionCallback
      callback?.()

      expect(createSpy).toHaveBeenCalled()
      done()
    })
  })
  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>
})

import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
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

import {
  AngularAcceleratorModule,
  ColumnType,
  providePortalDialogService,
  RowListGridData
} from '@onecx/angular-accelerator'
import { UserService } from '@onecx/angular-integration-interface'
import { provideUserServiceMock, UserServiceMock } from '@onecx/angular-integration-interface/mocks'
import {
  HAS_PERMISSION_CHECKER,
  PermissionService,
  PortalPageComponent,
  TranslationConnectionService
} from '@onecx/angular-utils'

import { skillSearchActions } from './skill-search.actions'
import { skillSearchColumns } from './skill-search.columns'
import { SkillSearchComponent } from './skill-search.component'
import { SkillSearchHarness } from './skill-search.harness'
import { initialState } from './skill-search.reducers'
import { selectSkillSearchViewModel } from './skill-search.selectors'
import { SkillSearchViewModel } from './skill-search.viewmodel'

describe('SkillSearchComponent', () => {
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
  let component: SkillSearchComponent
  let fixture: ComponentFixture<SkillSearchComponent>
  let store: MockStore<Store>
  let formBuilder: FormBuilder

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  // ACTION S11: Change test data in the whole document
  const baseSkillSearchViewModel: SkillSearchViewModel = {
    columns: skillSearchColumns,
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
        SkillSearchComponent,
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
          initialState: { skill: { search: initialState } }
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
      'SKILL#CREATE',
      'SKILL#EDIT',
      'SKILL#DELETE',
      'SKILL#IMPORT',
      'SKILL#EXPORT',
      'SKILL#VIEW',
      'SKILL#SEARCH'
    ])

    formBuilder = TestBed.inject(FormBuilder)
    store = TestBed.inject(MockStore)
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectSkillSearchViewModel, baseSkillSearchViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(SkillSearchComponent)
    component = fixture.componentInstance
    await TestbedHarnessEnvironment.harnessForFixture(fixture, SkillSearchHarness)
    fixture.detectChanges()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should dispatch resetButtonClicked action on resetSearch', (done) => {
    store.scannedActions$.pipe(ofType(skillSearchActions.resetButtonClicked)).subscribe(() => {
      expect(store.dispatch).toHaveBeenCalledWith(skillSearchActions.resetButtonClicked())
      done()
    })

    component.resetSearch()
  })

  it('should have 2 overFlow header actions when search config is disabled', async () => {
    const actions = await firstValueFrom(component.headerActions$)
    const overflowActions = actions.filter((a) => a.show === 'asOverflow')
    expect(overflowActions).toHaveLength(2)
    const exportAllActionItem = overflowActions.find((a) => a.labelKey === 'SKILL_SEARCH.HEADER_ACTIONS.EXPORT_ALL')
    expect(exportAllActionItem).not.toBeNull()
    const showHideChartActionItem = overflowActions.find((a) => a.labelKey === 'SKILL_SEARCH.HEADER_ACTIONS.SHOW_CHART')
    expect(showHideChartActionItem).not.toBeNull()
  })

  it('should display hide chart action if chart is visible', async () => {
    store.overrideSelector(selectSkillSearchViewModel, { ...baseSkillSearchViewModel, chartVisible: true })
    store.refreshState()
    const actions = await firstValueFrom(component.headerActions$)
    const overflowActions = actions.filter((a) => a.show === 'asOverflow')
    expect(overflowActions).toHaveLength(2)
    const hideChartAction = overflowActions.find((a) => a.labelKey === 'SKILL_SEARCH.HEADER_ACTIONS.HIDE_CHART')
    expect(hideChartAction).not.toBeNull()
  })

  it('should display chosen column in the diagram', async () => {
    component.diagramColumnId = 'changeMe'
    store.overrideSelector(selectSkillSearchViewModel, {
      ...baseSkillSearchViewModel,
      chartVisible: true,
      results: [
        { id: '1', imagePath: '', changeMe: 'val_1' },
        { id: '2', imagePath: '', changeMe: 'val_2' },
        { id: '3', imagePath: '', changeMe: 'val_2' }
      ],
      columns: [
        {
          columnType: ColumnType.STRING,
          id: 'changeMe',
          nameKey: 'SKILL_SEARCH.RESULTS.CHANGE_ME',
          filterable: true,
          sortable: true,
          predefinedGroupKeys: [
            'SKILL_SEARCH.PREDEFINED_GROUP.DEFAULT',
            'SKILL_SEARCH.PREDEFINED_GROUP.EXTENDED',
            'SKILL_SEARCH.PREDEFINED_GROUP.FULL'
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
    const breadcrumbSvc = component['breadcrumbService']
    jest.spyOn(breadcrumbSvc, 'setItems')
    component.ngOnInit()
    fixture.detectChanges()
    expect(breadcrumbSvc.setItems).toHaveBeenCalledWith([
      { titleKey: 'SKILL_SEARCH.BREADCRUMB', labelKey: 'SKILL_SEARCH.BREADCRUMB', routerLink: '/skill' }
    ])
  })

  it('should dispatch searchButtonClicked action on search', (done) => {
    const formValue = formBuilder.group({
      changeMe: '123'
    })
    component.skillSearchFormGroup = formValue

    store.scannedActions$.pipe(ofType(skillSearchActions.searchButtonClicked)).subscribe((a) => {
      expect(a.searchCriteria).toEqual({ changeMe: '123' })
      done()
    })

    component.search(formValue)
  })

  it('should dispatch viewModeChanged action on view mode changes', async () => {
    jest.spyOn(store, 'dispatch')

    component.searchHeaderComponentStateChanged({ activeViewMode: 'advanced' })

    expect(store.dispatch).toHaveBeenCalledWith(
      skillSearchActions.searchHeaderComponentStateChanged({
        activeViewMode: 'advanced'
      })
    )
  })

  it('should dispatch resultComponentStateChanged on data view column change', () => {
    jest.spyOn(store, 'dispatch')
    const columns = [
      {
        columnType: ColumnType.STRING,
        id: 'changeMe',
        nameKey: 'SKILL_SEARCH.RESULTS.CHANGE_ME',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
          'SKILL_SEARCH.PREDEFINED_GROUP.DEFAULT',
          'SKILL_SEARCH.PREDEFINED_GROUP.EXTENDED',
          'SKILL_SEARCH.PREDEFINED_GROUP.FULL'
        ]
      }
    ]
    const state = {
      layout: 'table',
      displayedColumns: columns
    }

    component.resultComponentStateChanged(state as never)

    expect(store.dispatch).toHaveBeenCalledWith(skillSearchActions.resultComponentStateChanged(state as never))
  })

  it('should dispatch chartVisibilityToggled on show/hide chart header', async () => {
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectSkillSearchViewModel, { ...baseSkillSearchViewModel, chartVisible: false })
    store.refreshState()
    const actions = await firstValueFrom(component.headerActions$)
    const showChartAction = actions.find((a) => a.labelKey === 'SKILL_SEARCH.HEADER_ACTIONS.SHOW_CHART')
    expect(showChartAction).toBeTruthy()
    showChartAction?.actionCallback?.()
    expect(store.dispatch).toHaveBeenCalledWith(skillSearchActions.chartVisibilityToggled())
  })

  it('should display translated headers', async () => {
    fixture.detectChanges()
    await fixture.whenStable()
    const pageContent = fixture.nativeElement.textContent
    expect(pageContent).toContain('Skill Search')
    expect(pageContent).toContain('Search and manage skills')
  })

  it('should display translated empty message when no search results', async () => {
    const columns = [
      {
        columnType: ColumnType.STRING,
        id: 'changeMe',
        nameKey: 'SKILL_SEARCH.RESULTS.CHANGE_ME',
        filterable: true,
        sortable: true,
        predefinedGroupKeys: [
          'SKILL_SEARCH.PREDEFINED_GROUP.DEFAULT',
          'SKILL_SEARCH.PREDEFINED_GROUP.EXTENDED',
          'SKILL_SEARCH.PREDEFINED_GROUP.FULL'
        ]
      }
    ]
    store.overrideSelector(selectSkillSearchViewModel, {
      ...baseSkillSearchViewModel,
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
    component.diagramColumnId = 'changeMe'
    const col = {
      columnType: ColumnType.STRING,
      id: 'changeMe',
      nameKey: 'SKILL_SEARCH.RESULTS.CHANGE_ME',
      filterable: true,
      sortable: true,
      predefinedGroupKeys: [
        'SKILL_SEARCH.PREDEFINED_GROUP.DEFAULT',
        'SKILL_SEARCH.PREDEFINED_GROUP.EXTENDED',
        'SKILL_SEARCH.PREDEFINED_GROUP.FULL'
      ]
    }

    store.overrideSelector(selectSkillSearchViewModel, {
      ...baseSkillSearchViewModel,
      results: [],
      chartVisible: true,
      columns: [col]
    })
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('ocx-group-by-count-diagram')).toBeNull()

    store.overrideSelector(selectSkillSearchViewModel, {
      ...baseSkillSearchViewModel,
      results: [{ id: '1', imagePath: '', changeMe: 'val_1' }],
      chartVisible: false,
      columns: [col]
    })
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('ocx-group-by-count-diagram')).toBeNull()

    store.overrideSelector(selectSkillSearchViewModel, {
      ...baseSkillSearchViewModel,
      results: [{ id: '1', imagePath: '', changeMe: 'val_1' }],
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
    const exportAction = actions.find((a) => a.labelKey === 'SKILL_SEARCH.HEADER_ACTIONS.EXPORT_ALL')
    expect(exportAction).toBeTruthy()
    exportAction?.actionCallback?.()
    expect(store.dispatch).toHaveBeenCalledWith(skillSearchActions.exportButtonClicked())
  })

  describe('searchCriteria mapping', () => {
    const cases = [
      {
        desc: 'should convert Date values to UTC and dispatch searchButtonClicked',
        formValue: { changeMe: new Date(2024, 4, 15) },
        expected: { changeMe: new Date(Date.UTC(2024, 4, 15)) }
      },
      {
        desc: 'should pass through non-date, non-empty values unchanged',
        formValue: { changeMe: 'testName' },
        expected: { changeMe: 'testName' }
      },
      {
        desc: 'should set searchCriteria property to undefined for null values',
        formValue: { changeMe: null },
        expected: { changeMe: undefined }
      }
    ]

    cases.forEach(({ desc, formValue, expected }) => {
      it(desc, () => {
        jest.spyOn(store, 'dispatch')

        component.skillSearchFormGroup = {
          value: formValue,
          getRawValue: () => formValue
        } as unknown as FormGroup

        component.search(component.skillSearchFormGroup)

        const calls = (store.dispatch as jest.Mock).mock.calls
        expect(calls.length).toBeGreaterThan(0)
        const lastAction = calls[calls.length - 1][0]
        expect(lastAction.type).toBe(skillSearchActions.searchButtonClicked.type)
        expect(lastAction.searchCriteria).toEqual(expected)
      })
    })
  })

  describe('actions dispatch', () => {
    const cases = [
      {
        method: 'resultComponentStateChanged',
        action: skillSearchActions.resultComponentStateChanged,
        payload: { groupKey: 'test-group' }
      },
      {
        method: 'searchHeaderComponentStateChanged',
        action: skillSearchActions.searchHeaderComponentStateChanged,
        payload: { activeViewMode: 'basic' as 'basic' | 'advanced', selectedSearchConfig: 'config1' }
      },
      {
        method: 'diagramComponentStateChanged',
        action: skillSearchActions.diagramComponentStateChanged,
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
    expect(store.dispatch).toHaveBeenCalledWith(skillSearchActions.detailsButtonClicked({ id: 'test-id' }))
  })

  it('should dispatch editSkillButtonClicked action on edit()', () => {
    jest.spyOn(store, 'dispatch')
    const row: RowListGridData = { id: 'test-id', imagePath: '' }
    component.edit(row)
    expect(store.dispatch).toHaveBeenCalledWith(skillSearchActions.editSkillButtonClicked({ id: 'test-id' }))
  })

  it('should dispatch editSkillButtonClicked action on item edit click', () => {
    jest.spyOn(store, 'dispatch')
    component.edit({ id: '1', imagePath: '' })
    expect(store.dispatch).toHaveBeenCalledWith(skillSearchActions.editSkillButtonClicked({ id: '1' }))
  })

  it('should dispatch createSkillButtonClicked action on create click', () => {
    jest.spyOn(store, 'dispatch')
    component.create()
    expect(store.dispatch).toHaveBeenCalledWith(skillSearchActions.createSkillButtonClicked())
  })
  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>
})

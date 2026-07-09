import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { By } from '@angular/platform-browser'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { RowListGridData } from '@onecx/angular-accelerator'
import { PrimeIcons } from 'primeng/api'

import { provideHttpClient } from '@angular/common/http'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store, StoreModule } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { AngularAcceleratorModule, ColumnType, providePortalDialogService } from '@onecx/angular-accelerator'
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
  let skillSearch: SkillSearchHarness

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
    fixture.detectChanges()
    skillSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, SkillSearchHarness)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should dispatch resetButtonClicked action on resetSearch', (done) => {
    store.scannedActions$.pipe(ofType(skillSearchActions.resetButtonClicked)).subscribe(() => {
      done()
    })

    component.resetSearch()
  })

  it('should have 2 overFlow header actions when search config is disabled', async () => {
    const searchHeader = await skillSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const overflowMenuItems = await pageHeader.getOverFlowMenuItems()
    expect(overflowMenuItems.length).toBe(2)

    const exportAllActionItem = await pageHeader.getOverFlowMenuItem('Export all')
    expect(exportAllActionItem).not.toBeNull()
    if (exportAllActionItem) expect(await exportAllActionItem.getText()).toBe('Export all')

    const showHideChartActionItem = await pageHeader.getOverFlowMenuItem('Show chart')
    expect(showHideChartActionItem).not.toBeNull()
    if (showHideChartActionItem) expect(await showHideChartActionItem.getText()).toBe('Show chart')
  })

  it('should display hide chart action if chart is visible', async () => {
    store.overrideSelector(selectSkillSearchViewModel, {
      ...baseSkillSearchViewModel,
      chartVisible: true
    })
    store.refreshState()

    const searchHeader = await skillSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const overflowMenuItems = await pageHeader.getOverFlowMenuItems()
    expect(overflowMenuItems.length).toBe(2)

    const showHideChartActionItem = await pageHeader.getOverFlowMenuItem('Hide chart')
    expect(showHideChartActionItem).not.toBeNull()
    if (showHideChartActionItem) expect(await showHideChartActionItem.getText()).toEqual('Hide chart')
  })

  it('should display chosen column in the diagram', async () => {
    component.diagramColumnId = 'changeMe'
    store.overrideSelector(selectSkillSearchViewModel, {
      ...baseSkillSearchViewModel,
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

    const diagram = await (await skillSearch.getDiagram())?.getDiagram()
    if (diagram) {
      expect(await diagram.getTotalNumberOfResults()).toBe(3)
      expect(await diagram.getSumLabel()).toEqual('Total')
    }
  })

  it('should display correct breadcrumbs', async () => {
    const searchHeader = await skillSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Search')

    if (searchBreadcrumbItem) expect(await searchBreadcrumbItem.getText()).toEqual('Search')
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

  it('should dispatch displayedColumnsChanged on data view column change', async () => {
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
    store.overrideSelector(selectSkillSearchViewModel, {
      ...baseSkillSearchViewModel,
      results: [],
      columns: columns,
      resultComponentState: { layout: 'table' }
    })
    store.refreshState()

    const interactiveDataView = await skillSearch.getSearchResults()
    const columnGroupSelector = await interactiveDataView?.getCustomGroupColumnSelector()
    expect(columnGroupSelector).toBeTruthy()

    if (columnGroupSelector) {
      await columnGroupSelector.openCustomGroupColumnSelectorDialog()
      const pickList = await columnGroupSelector.getPicklist()
      const transferControlButtons = await pickList.getTransferControlsButtons()
      expect(transferControlButtons.length).toBe(4)

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

    store.overrideSelector(selectSkillSearchViewModel, {
      ...baseSkillSearchViewModel,
      chartVisible: false
    })
    store.refreshState()

    const searchHeader = await skillSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const showChartActionItem = await pageHeader.getOverFlowMenuItem('Show chart')
    if (showChartActionItem) {
      await showChartActionItem.selectItem()
      expect(store.dispatch).toHaveBeenCalledWith(skillSearchActions.chartVisibilityToggled())
    }
  })

  it('should display translated headers', async () => {
    const searchHeader = await skillSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    expect(await pageHeader.getHeaderText()).toEqual('Skill Search')
    expect(await pageHeader.getSubheaderText()).toEqual('Search and manage skills')
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
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const interactiveDataView = await skillSearch.getSearchResults()
    const dataView = await interactiveDataView.getDataView()
    // switch to list layout for testing table
    await (await interactiveDataView.getDataLayoutSelection()).selectListLayout()
    const dataTable = await dataView.getDataListGrid()
    if (dataTable) {
      const rows = await dataTable.getActionButtons('list')
      expect(rows.length).toBe(0)
    }
    expect(fixture.debugElement.query(By.css('.p-dataview-emptymessage'))).not.toBeNull()
  })

  it('should not display chart when no results or toggled to not visible', async () => {
    component.diagramColumnId = 'changeMe'

    store.overrideSelector(selectSkillSearchViewModel, {
      ...baseSkillSearchViewModel,
      results: [],
      chartVisible: true,
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

    let diagram = await skillSearch.getDiagram()
    expect(diagram).toBeNull()

    store.overrideSelector(selectSkillSearchViewModel, {
      ...baseSkillSearchViewModel,
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

    diagram = await skillSearch.getDiagram()
    expect(diagram).toBeNull()

    store.overrideSelector(selectSkillSearchViewModel, {
      ...baseSkillSearchViewModel,
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

    diagram = await skillSearch.getDiagram()
    expect(diagram).toBeTruthy()
  })

  it('should export csv data on export action click', async () => {
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
      results: results,
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const searchHeader = await skillSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const exportAllActionItem = await pageHeader.getOverFlowMenuItem('Export all')
    if (exportAllActionItem) await exportAllActionItem.selectItem()

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

  it('should dispatch editSkillButtonClicked action on item edit click', async () => {
    jest.spyOn(store, 'dispatch')

    store.overrideSelector(selectSkillSearchViewModel, {
      ...baseSkillSearchViewModel,
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

    const interactiveDataView = await skillSearch.getSearchResults()
    const dataView = await interactiveDataView.getDataView()
    const dataTable = await dataView.getDataListGrid()
    const rowActionButtons = await dataTable?.getActionButtons('list')

    if (rowActionButtons) {
      expect(rowActionButtons?.length).toBeGreaterThan(0)
      let editButton
      for (const actionButton of rowActionButtons ?? []) {
        const icon = await actionButton.getAttribute('ng-reflect-icon')
        expect(icon).toBeTruthy()
        if (icon === 'pi pi-pencil') {
          editButton = actionButton
        }
      }
      expect(editButton).toBeTruthy()
      await editButton?.click()

      expect(store.dispatch).toHaveBeenCalledWith(skillSearchActions.editSkillButtonClicked({ id: '1' }))
    }
  })

  it('should dispatch createSkillButtonClicked action on create click', async () => {
    jest.spyOn(store, 'dispatch')

    const header = await skillSearch.getHeader()
    const createButton = await (await header.getPageHeader()).getInlineActionButtonByIcon(PrimeIcons.PLUS)

    expect(createButton).toBeTruthy()
    await createButton?.click()

    expect(store.dispatch).toHaveBeenCalledWith(skillSearchActions.createSkillButtonClicked())
  })
  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>
})

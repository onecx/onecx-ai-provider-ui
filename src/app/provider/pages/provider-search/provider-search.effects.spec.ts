import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Actions } from '@ngrx/effects'
import { Store, StoreModule } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { AlwaysGrantPermissionChecker, HAS_PERMISSION_CHECKER, providePermissionService } from '@onecx/angular-utils'
import { AngularAcceleratorModule, ExportDataService, PortalDialogService } from '@onecx/angular-accelerator'
import { ColumnType } from '@onecx/angular-accelerator'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'
import { firstValueFrom, of, Subject, take, toArray, throwError } from 'rxjs'
import { ProviderSearchActions } from './provider-search.actions'
import { ProviderSearchColumns } from './provider-search.columns'
import { ProviderSearchComponent } from './provider-search.component'
import { ProviderSearchEffects } from './provider-search.effects'
import { ProviderSearchHarness } from './provider-search.harness'
import { initialState } from './provider-search.reducers'
import { selectProviderSearchViewModel } from './provider-search.selectors'
import { ProviderSearchViewModel } from './provider-search.viewmodel'
import { Provider, ProviderService } from 'src/app/shared/generated'
import { Router } from '@angular/router'
import { HttpErrorResponse } from '@angular/common/http'

describe('ProviderSearchComponent effects', () => {
  let component: ProviderSearchComponent
  let fixture: ComponentFixture<ProviderSearchComponent>
  let store: MockStore<Store>
  let formBuilder: FormBuilder
  let ProviderSearch: ProviderSearchHarness
  let actionsSubject: Subject<any>
  let effects: ProviderSearchEffects
  let providerService: { getProviderHealthStatusesByIds: jest.Mock }

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

    actionsSubject = new Subject<any>()
    providerService = {
      getProviderHealthStatusesByIds: jest.fn()
    }

    effects = new ProviderSearchEffects(
      { openDialog: jest.fn() } as unknown as PortalDialogService,
      new Actions(actionsSubject),
      ({ queryParams: of({}) } as unknown) as ActivatedRoute,
      providerService as unknown as ProviderService,
      { navigate: jest.fn(), parseUrl: jest.fn(), events: of({}) } as unknown as Router,
      { select: jest.fn(() => of(undefined)) } as unknown as Store,
      { success: jest.fn(), error: jest.fn() } as unknown as PortalMessageService,
      { exportCsv: jest.fn() } as unknown as ExportDataService
    )
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
  
  describe('ProviderSearchEffects health polling', () => {
    it('should emit health poll ticks for each result and fallback to empty id', async () => {
      const promise = firstValueFrom(effects.pollProviderHealth$.pipe(take(2), toArray()))
  
      actionsSubject.next(
        ProviderSearchActions.providerSearchResultsReceived({
          results: [{ id: 'p1' } as Provider, { id: undefined } as Provider],
          totalNumberOfResults: 2
        })
      )
  
      await expect(promise).resolves.toEqual([
        ProviderSearchActions.providerHealthPollTicked({ id: 'p1' }),
        ProviderSearchActions.providerHealthPollTicked({ id: '' })
      ])
    })
  
    it('should update health status from provider service response', async () => {
      providerService.getProviderHealthStatusesByIds.mockReturnValue(
        of({ providerHealthStatuses: [{ status: 'ONLINE' }] })
      )
  
      const promise = firstValueFrom(effects.updateProviderHealthStatus$)
      actionsSubject.next(ProviderSearchActions.providerHealthPollTicked({ id: 'p1' }))
  
      await expect(promise).resolves.toEqual(
        ProviderSearchActions.providerHealthStatusUpdated({ id: 'p1', status: 'ONLINE' })
      )
    })
  
    it('should fallback to NODATA when response status is missing', async () => {
      providerService.getProviderHealthStatusesByIds.mockReturnValue(
        of({ providerHealthStatuses: [{}] })
      )
  
      const promise = firstValueFrom(effects.updateProviderHealthStatus$)
      actionsSubject.next(ProviderSearchActions.providerHealthPollTicked({ id: 'p1' }))
  
      await expect(promise).resolves.toEqual(
        ProviderSearchActions.providerHealthStatusUpdated({ id: 'p1', status: 'NODATA' })
      )
    })
  
    it('should fallback to NODATA when service returns undefined response', async () => {
      providerService.getProviderHealthStatusesByIds.mockReturnValue(of(undefined))
  
      const promise = firstValueFrom(effects.updateProviderHealthStatus$)
      actionsSubject.next(ProviderSearchActions.providerHealthPollTicked({ id: 'p1' }))
  
      await expect(promise).resolves.toEqual(
        ProviderSearchActions.providerHealthStatusUpdated({ id: 'p1', status: 'OFFLINE' })
      )
    })
  
    it('should map 404 error to NODATA', async () => {
      providerService.getProviderHealthStatusesByIds.mockReturnValue(
        throwError(() => ({ status: 404 } as HttpErrorResponse))
      )
  
      const promise = firstValueFrom(effects.updateProviderHealthStatus$)
      actionsSubject.next(ProviderSearchActions.providerHealthPollTicked({ id: 'p1' }))
  
      await expect(promise).resolves.toEqual(
        ProviderSearchActions.providerHealthStatusUpdated({ id: 'p1', status: 'NODATA' })
      )
    })

    it('should map undefined error object to OFFLINE', async () => {
      providerService.getProviderHealthStatusesByIds.mockReturnValue(
        throwError(() => undefined)
      )
  
      const promise = firstValueFrom(effects.updateProviderHealthStatus$)
      actionsSubject.next(ProviderSearchActions.providerHealthPollTicked({ id: 'p1' }))
  
      await expect(promise).resolves.toEqual(
        ProviderSearchActions.providerHealthStatusUpdated({ id: 'p1', status: 'OFFLINE' })
      )
    })
  
    it('should return NODATA immediately for empty id without calling service', async () => {
      const promise = firstValueFrom(effects.updateProviderHealthStatus$)
      actionsSubject.next(ProviderSearchActions.providerHealthPollTicked({ id: '' }))
  
      await expect(promise).resolves.toEqual(
        ProviderSearchActions.providerHealthStatusUpdated({ id: '', status: 'NODATA' })
      )
      expect(providerService.getProviderHealthStatusesByIds).not.toHaveBeenCalled()
    })
  })
})


import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { AlwaysGrantPermissionChecker, HAS_PERMISSION_CHECKER, providePermissionService } from '@onecx/angular-utils'
import { AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { provideUserServiceMock } from '@onecx/angular-integration-interface/mocks'
import { ExportDataService } from '@onecx/angular-accelerator'
import { ScaffoldSearchComponent } from './scaffold-search.component'
import { selectScaffoldSearchViewModel } from './scaffold-search.selectors'
import { scaffoldSearchColumns } from './scaffold-search.columns'
import { ScaffoldSearchViewModel } from './scaffold-search.viewmodel'

describe('ScaffoldSearchComponent - Comprehensive Coverage', () => {
  let component: ScaffoldSearchComponent
  let fixture: ComponentFixture<ScaffoldSearchComponent>
  let store: MockStore<Store>

  const mockActivatedRoute = { snapshot: { data: {} } }

  const baseViewModel: ScaffoldSearchViewModel = {
    columns: scaffoldSearchColumns,
    searchCriteria: {},
    results: [],
    chartVisible: false,
    viewMode: 'basic',
    displayedColumns: []
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ScaffoldSearchComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        LetDirective,
        AngularAcceleratorModule,
        TranslateTestingModule.withTranslations({})
      ],
      providers: [
        FormBuilder,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: HAS_PERMISSION_CHECKER, useClass: AlwaysGrantPermissionChecker },
        { provide: ExportDataService, useValue: { exportCsv: jest.fn() } },
        provideUserServiceMock(),
        ...providePermissionService(),
        provideMockStore({
          selectors: [{ selector: selectScaffoldSearchViewModel, value: baseViewModel }]
        })
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(ScaffoldSearchComponent)
    component = fixture.componentInstance
    store = TestBed.inject<MockStore<Store>>(MockStore)
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('HeaderActions', () => {
    it('should have create action', (done) => {
      component.headerActions$.subscribe((actions) => {
        const createAction = actions.find((a) => a.labelKey === 'SCAFFOLD_CREATE_UPDATE.ACTION.CREATE')
        expect(createAction).toBeDefined()
        expect(createAction?.icon).toBeDefined()
        done()
      })
    })

    it('should have export action', (done) => {
      component.headerActions$.subscribe((actions) => {
        const exportAction = actions.find((a) => a.labelKey === 'SCAFFOLD_SEARCH.HEADER_ACTIONS.EXPORT_ALL')
        expect(exportAction).toBeDefined()
        done()
      })
    })

    it('should show chart action as Show chart when chartVisible is false', (done) => {
      store.overrideSelector(selectScaffoldSearchViewModel, {
        ...baseViewModel,
        chartVisible: false
      })
      store.refreshState()

      component.headerActions$.subscribe((actions) => {
        const chartAction = actions.find(
          (a) => a.labelKey === 'SCAFFOLD_SEARCH.HEADER_ACTIONS.SHOW_CHART'
        )
        expect(chartAction).toBeDefined()
        done()
      })
    })

    it('should show chart action as Hide chart when chartVisible is true', (done) => {
      store.overrideSelector(selectScaffoldSearchViewModel, {
        ...baseViewModel,
        chartVisible: true
      })
      store.refreshState()

      component.headerActions$.subscribe((actions) => {
        const chartAction = actions.find(
          (a) => a.labelKey === 'SCAFFOLD_SEARCH.HEADER_ACTIONS.HIDE_CHART'
        )
        expect(chartAction).toBeDefined()
        done()
      })
    })

    it('should call create when create action is triggered', (done) => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.headerActions$.subscribe((actions) => {
        const createAction = actions.find((a) => a.labelKey === 'SCAFFOLD_CREATE_UPDATE.ACTION.CREATE')
        createAction?.actionCallback?.()
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({ type: expect.stringContaining('Create scaffold button clicked') })
        )
        done()
      })
    })

    it('should call exportItems when export action is triggered', (done) => {
      const exportSpy = jest.spyOn(component, 'exportItems')
      component.headerActions$.subscribe((actions) => {
        const exportAction = actions.find((a) => a.labelKey === 'SCAFFOLD_SEARCH.HEADER_ACTIONS.EXPORT_ALL')
        exportAction?.actionCallback?.()
        expect(exportSpy).toHaveBeenCalled()
        done()
      })
    })

    it('should call toggleChartVisibility when chart action is triggered', (done) => {
      const toggleSpy = jest.spyOn(component, 'toggleChartVisibility')
      component.headerActions$.subscribe((actions) => {
        const chartAction = actions.find(
          (a) => a.labelKey === 'SCAFFOLD_SEARCH.HEADER_ACTIONS.SHOW_CHART' || 
                 a.labelKey === 'SCAFFOLD_SEARCH.HEADER_ACTIONS.HIDE_CHART'
        )
        chartAction?.actionCallback?.()
        expect(toggleSpy).toHaveBeenCalled()
        done()
      })
    })
  })

  describe('Form Methods', () => {
    it('should handle Date values in search', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      const testDate = new Date('2024-01-01')
      component.scaffoldSearchFormGroup.patchValue({ sourceProduct: testDate })
      component.search(component.scaffoldSearchFormGroup)

      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Object))
    })

    it('should reset form on resetSearch', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.resetSearch()

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: expect.stringContaining('Reset button clicked') })
      )
    })
  })

  describe('Component Actions', () => {
    it('should dispatch details action with id', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.details({ id: '123', imagePath: '' } as any)

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: '123' })
      )
    })

    it('should dispatch edit action with id', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.edit({ id: '456', imagePath: '' } as any)

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: '456' })
      )
    })

    it('should dispatch delete action with id', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.delete({ id: '789', imagePath: '' } as any)

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: '789' })
      )
    })

    it('should dispatch viewModeChanged with basic mode', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.viewModeChanged('basic')

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ viewMode: 'basic' })
      )
    })

    it('should dispatch displayedColumnsChanged', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      const columns = [
        { id: 'name', nameKey: 'Name', columnType: undefined as any },
        { id: 'sourceProduct', nameKey: 'Source', columnType: undefined as any }
      ]
      component.onDisplayedColumnsChange(
        new CustomEvent('displayedColumnsChange', { detail: columns })
      )

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ displayedColumns: columns })
      )
    })
  })

  describe('ViewModel Subscription', () => {
    it('should patch form with searchCriteria from viewModel', (done) => {
      const testCriteria = { name: 'test', sourceProduct: 'product' }
      store.overrideSelector(selectScaffoldSearchViewModel, {
        ...baseViewModel,
        searchCriteria: testCriteria
      })
      store.refreshState()

      component.viewModel$.subscribe(() => {
        setTimeout(() => {
          expect(component.scaffoldSearchFormGroup.getRawValue()).toEqual(
            expect.objectContaining({ name: 'test' })
          )
          done()
        }, 50)
      })
    })
  })
})

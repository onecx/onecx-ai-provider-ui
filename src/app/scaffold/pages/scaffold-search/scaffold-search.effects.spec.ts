import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { provideMockStore, MockStore } from '@ngrx/store/testing'
import { providePortalMessageServiceMock, PortalMessageServiceMock } from '@onecx/angular-integration-interface/mocks'
import { ExportDataService, PortalDialogService, DialogState } from '@onecx/angular-accelerator'
import { ReplaySubject, of, throwError } from 'rxjs'
import { ScaffoldService, Scaffold } from 'src/app/shared/generated'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import { ScaffoldSearchActions } from './scaffold-search.actions'
import { ScaffoldSearchEffects } from './scaffold-search.effects'
import { ScaffoldSearchCriteria } from './scaffold-search.parameters'
import { scaffoldSearchSelectors, selectScaffoldSearchViewModel } from './scaffold-search.selectors'
import { ScaffoldSearchComponent } from './scaffold-search.component'
import { routerNavigatedAction } from '@ngrx/router-store'

jest.mock('@onecx/ngrx-accelerator', () => {
  const actual = jest.requireActual('@onecx/ngrx-accelerator')

  return {
    ...actual,
    filterForNavigatedTo: () => (source$: any) => source$,
    filterOutQueryParamsHaveNotChanged: () => (source$: any) => source$,
    filterOutOnlyQueryParamsChanged: () => (source$: any) => source$
  }
})

describe('ScaffoldSearchEffects', () => {
  const mockActivatedRoute = { snapshot: { data: {}, queryParams: {} }, queryParams: of({}) }
  let actions$: ReplaySubject<unknown>
  let effects: ScaffoldSearchEffects
  let router: jest.Mocked<Router>
  let scaffoldService: jest.Mocked<ScaffoldService>
  let portalDialogService: jest.Mocked<PortalDialogService>
  let exportDataService: jest.Mocked<ExportDataService>
  let messageService: jest.Mocked<PortalMessageServiceMock>
  let store: MockStore

  const mockCriteria: ScaffoldSearchCriteria = { name: 'test-name' }
  const mockScaffold: Scaffold = { id: '1', name: 'Test', sourceProduct: 'Prod', systemPrompt: 'Prompt' } as any

  beforeEach(async () => {
    actions$ = new ReplaySubject(1)

    scaffoldService = {
      findScaffoldByCriteria: jest.fn(),
      createScaffold: jest.fn(),
      updateScaffoldById: jest.fn(),
      deleteScaffoldById: jest.fn()
    } as unknown as jest.Mocked<ScaffoldService>

    router = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
      parseUrl: jest.fn().mockImplementation((url: string) => ({
        queryParams: {},
        fragment: null,
        toString: () => url.split('?')[0]
      })),
      events: of(),
      routerState: {
        root: {
          component: ScaffoldSearchComponent,
          children: []
        }
      }
    } as unknown as jest.Mocked<Router>

    portalDialogService = {
      openDialog: jest.fn()
    } as unknown as jest.Mocked<PortalDialogService>

    exportDataService = { exportCsv: jest.fn() } as unknown as jest.Mocked<ExportDataService>

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        ScaffoldSearchEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [
            { selector: scaffoldSearchSelectors.selectCriteria, value: mockCriteria },
            { selector: selectUrl, value: '/scaffold' },
            { selector: scaffoldSearchSelectors.selectResults, value: [mockScaffold] },
            { selector: scaffoldSearchSelectors.selectChartVisible, value: false },
            { selector: selectScaffoldSearchViewModel, value: { displayedColumns: [], results: [mockScaffold] } as any }
          ]
        }),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: router },
        { provide: ScaffoldService, useValue: scaffoldService },
        { provide: PortalDialogService, useValue: portalDialogService },
        { provide: ExportDataService, useValue: exportDataService },
        providePortalMessageServiceMock()
      ]
    }).compileComponents()

    effects = TestBed.inject(ScaffoldSearchEffects)
    store = TestBed.inject(MockStore)
    messageService = TestBed.inject(PortalMessageServiceMock) as any
  })

  afterEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('performSearch', () => {
    it('should dispatch scaffoldSearchResultsReceived on success', (done) => {
      const mockResults = { stream: [mockScaffold], totalElements: 1 }
      scaffoldService.findScaffoldByCriteria.mockReturnValue(of(mockResults) as any)

      effects.performSearch({ name: 'test' }).subscribe((action) => {
        expect(action).toEqual(
          ScaffoldSearchActions.scaffoldSearchResultsReceived({
            results: mockResults.stream,
            totalNumberOfResults: 1
          })
        )
        done()
      })
    })

    it('should dispatch scaffoldSearchResultsLoadingFailed on error', (done) => {
      scaffoldService.findScaffoldByCriteria.mockReturnValue(throwError(() => new Error('API error')) as any)

      effects.performSearch({ name: 'test' }).subscribe((action) => {
        expect(action).toEqual(
          ScaffoldSearchActions.scaffoldSearchResultsLoadingFailed({ error: expect.any(Error) })
        )
        done()
      })
    })

    it('should handle null stream and totalElements', (done) => {
      const mockResults = { stream: null, totalElements: null }
      scaffoldService.findScaffoldByCriteria.mockReturnValue(of(mockResults) as any)

      effects.performSearch({}).subscribe((action) => {
        expect(action).toEqual(
          ScaffoldSearchActions.scaffoldSearchResultsReceived({ results: [], totalNumberOfResults: 0 })
        )
        done()
      })
    })

    it('should convert Date objects to ISO strings', (done) => {
      const mockResults = { stream: [], totalElements: 0 }
      const testDate = new Date('2023-01-01')
      scaffoldService.findScaffoldByCriteria.mockReturnValue(of(mockResults) as any)

      effects.performSearch({ date: testDate }).subscribe(() => {
        expect(scaffoldService.findScaffoldByCriteria).toHaveBeenCalledWith(
          expect.objectContaining({ date: testDate.toISOString() })
        )
        done()
      })
    })
  })

  describe('syncParamsToUrl$', () => {
    it('should navigate with criteria when search button is clicked', (done) => {
      effects.syncParamsToUrl$.subscribe(() => {
        expect(router.navigate).toHaveBeenCalled()
        done()
      })

      actions$.next(ScaffoldSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))
    })
  })

  describe('detailsButtonClicked$', () => {
    it('should navigate to details page when details button is clicked', (done) => {
      effects.detailsButtonClicked$.subscribe(() => {
        expect(router.navigate).toHaveBeenCalled()
        done()
      })

      actions$.next(ScaffoldSearchActions.detailsButtonClicked({ id: 'test-id' }))
    })
  })

  describe('searchByUrl$', () => {
    it('should perform search on router navigation', (done) => {
      const mockResults = { stream: [mockScaffold], totalElements: 1 }
      scaffoldService.findScaffoldByCriteria.mockReturnValue(of(mockResults) as any)

      effects.searchByUrl$.subscribe((action) => {
        expect(action).toEqual(
          ScaffoldSearchActions.scaffoldSearchResultsReceived({
            results: [mockScaffold],
            totalNumberOfResults: 1
          })
        )
        done()
      })

      actions$.next(
        routerNavigatedAction({
          payload: {
            routerState: {
              root: {
                component: ScaffoldSearchComponent,
                children: []
              }
            }
          }
        } as any)
      )
    })
  })

  describe('refreshSearchAfterCreateUpdate$', () => {
    it('should refresh search after create succeeded', (done) => {
      const mockResults = { stream: [mockScaffold], totalElements: 1 }
      scaffoldService.findScaffoldByCriteria.mockReturnValue(of(mockResults) as any)

      effects.refreshSearchAfterCreateUpdate$.subscribe((action) => {
        expect(action).toEqual(
          ScaffoldSearchActions.scaffoldSearchResultsReceived({
            results: [mockScaffold],
            totalNumberOfResults: 1
          })
        )
        done()
      })

      actions$.next(ScaffoldSearchActions.createScaffoldSucceeded())
    })
  })

  describe('refreshSearchAfterDelete$', () => {
    it('should refresh search after delete succeeded', (done) => {
      const mockResults = { stream: [mockScaffold], totalElements: 1 }
      scaffoldService.findScaffoldByCriteria.mockReturnValue(of(mockResults) as any)

      effects.refreshSearchAfterDelete$.subscribe((action) => {
        expect(action).toEqual(
          ScaffoldSearchActions.scaffoldSearchResultsReceived({
            results: [mockScaffold],
            totalNumberOfResults: 1
          })
        )
        done()
      })

      actions$.next(ScaffoldSearchActions.deleteScaffoldSucceeded())
    })
  })

  describe('editButtonClicked$', () => {
    it('should open edit dialog and update on success', (done) => {
      const dialogState: DialogState<Scaffold> = {
        button: 'primary',
        result: { ...mockScaffold, name: 'Updated' }
      }
      portalDialogService.openDialog.mockReturnValue(of(dialogState) as any)
      scaffoldService.updateScaffoldById.mockReturnValue(of({}) as any)

      effects.editButtonClicked$.subscribe((action) => {
        expect(action).toEqual(ScaffoldSearchActions.updateScaffoldSucceeded())
        done()
      })

      actions$.next(ScaffoldSearchActions.editScaffoldButtonClicked({ id: '1' }))
    })

    it('should handle edit dialog cancellation', (done) => {
      const dialogState: DialogState<Scaffold> = { button: 'secondary', result: mockScaffold }
      portalDialogService.openDialog.mockReturnValue(of(dialogState) as any)

      effects.editButtonClicked$.subscribe((action) => {
        expect(action).toEqual(ScaffoldSearchActions.updateScaffoldCancelled())
        done()
      })

      actions$.next(ScaffoldSearchActions.editScaffoldButtonClicked({ id: '1' }))
    })

    it('should handle missing dialog result', (done) => {
      const dialogState: DialogState<Scaffold> = { button: 'primary', result: undefined }
      portalDialogService.openDialog.mockReturnValue(of(dialogState) as any)

      effects.editButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(ScaffoldSearchActions.updateScaffoldFailed.type)
        expect((action as any).error).toBeInstanceOf(Error)
        done()
      })

      actions$.next(ScaffoldSearchActions.editScaffoldButtonClicked({ id: '1' }))
    })
  })

  describe('createButtonClicked$', () => {
    it('should open create dialog and create on success', (done) => {
      const dialogState: DialogState<Scaffold> = {
        button: 'primary',
        result: { ...mockScaffold, id: undefined } as any
      }
      portalDialogService.openDialog.mockReturnValue(of(dialogState) as any)
      scaffoldService.createScaffold.mockReturnValue(of({}) as any)

      effects.createButtonClicked$.subscribe((action) => {
        expect(action).toEqual(ScaffoldSearchActions.createScaffoldSucceeded())
        done()
      })

      actions$.next(ScaffoldSearchActions.createScaffoldButtonClicked())
    })

    it('should handle create dialog cancellation', (done) => {
      const dialogState: DialogState<Scaffold> = { button: 'secondary', result: mockScaffold }
      portalDialogService.openDialog.mockReturnValue(of(dialogState) as any)

      effects.createButtonClicked$.subscribe((action) => {
        expect(action).toEqual(ScaffoldSearchActions.createScaffoldCancelled())
        done()
      })

      actions$.next(ScaffoldSearchActions.createScaffoldButtonClicked())
    })

    it('should handle missing dialog result', (done) => {
      const dialogState: DialogState<Scaffold> = { button: 'primary', result: undefined }
      portalDialogService.openDialog.mockReturnValue(of(dialogState) as any)

      effects.createButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(ScaffoldSearchActions.createScaffoldFailed.type)
        expect((action as any).error).toBeInstanceOf(Error)
        done()
      })

      actions$.next(ScaffoldSearchActions.createScaffoldButtonClicked())
    })
  })

  describe('deleteButtonClicked$', () => {
    it('should open delete dialog and delete on success', (done) => {
      const dialogState: DialogState<unknown> = { button: 'primary', result: undefined }
      portalDialogService.openDialog.mockReturnValue(of(dialogState) as any)
      scaffoldService.deleteScaffoldById.mockReturnValue(of({}) as any)

      effects.deleteButtonClicked$.subscribe((action) => {
        expect(action).toEqual(ScaffoldSearchActions.deleteScaffoldSucceeded())
        done()
      })

      actions$.next(ScaffoldSearchActions.deleteScaffoldButtonClicked({ id: '1' }))
    })

    it('should handle delete dialog cancellation', (done) => {
      const dialogState: DialogState<unknown> = { button: 'secondary', result: undefined }
      portalDialogService.openDialog.mockReturnValue(of(dialogState) as any)

      effects.deleteButtonClicked$.subscribe((action) => {
        expect(action).toEqual(ScaffoldSearchActions.deleteScaffoldCancelled())
        done()
      })

      actions$.next(ScaffoldSearchActions.deleteScaffoldButtonClicked({ id: '1' }))
    })

    it('should handle missing item to delete', (done) => {
      const dialogState: DialogState<unknown> = { button: 'primary', result: undefined }
      portalDialogService.openDialog.mockReturnValue(of(dialogState) as any)
      store.overrideSelector(scaffoldSearchSelectors.selectResults, [])
      store.refreshState()

      effects.deleteButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(ScaffoldSearchActions.deleteScaffoldFailed.type)
        expect((action as any).error).toBeInstanceOf(Error)
        done()
      })

      actions$.next(ScaffoldSearchActions.deleteScaffoldButtonClicked({ id: '999' }))
    })
  })

  describe('rehydrateChartVisibility$', () => {
    it('should rehydrate chart visibility from localStorage when false', (done) => {
      localStorage.setItem('ScaffoldChartVisibility', 'false')

      effects.rehydrateChartVisibility$.subscribe((action) => {
        expect(action).toEqual(ScaffoldSearchActions.chartVisibilityRehydrated({ visible: false }))
        done()
      })

      actions$.next(
        routerNavigatedAction({
          payload: {
            routerState: {
              root: {
                component: ScaffoldSearchComponent,
                children: []
              }
            }
          }
        } as any)
      )
    })
  })

  describe('saveChartVisibility$', () => {
    it('should save chart visibility to localStorage when toggled to false', (done) => {
      store.overrideSelector(scaffoldSearchSelectors.selectChartVisible, false)

      effects.saveChartVisibility$.subscribe(() => {
        expect(localStorage.getItem('ScaffoldChartVisibility')).toBe('false')
        done()
      })

      actions$.next(ScaffoldSearchActions.chartVisibilityToggled())
    })
  })

  describe('exportData$', () => {
    it('should export data to CSV when export button is clicked', (done) => {
      const mockViewModel = {
        displayedColumns: [{ key: 'name' }, { key: 'sourceProduct' }],
        results: [mockScaffold]
      }
      store.overrideSelector(selectScaffoldSearchViewModel, mockViewModel as any)

      effects.exportData$.subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(
          mockViewModel.displayedColumns,
          mockViewModel.results,
          'Scaffold.csv'
        )
        done()
      })

      actions$.next(ScaffoldSearchActions.exportButtonClicked())
    })
  })

  describe('displayError$', () => {
    it('should display error message when search results loading failed', (done) => {
      const errorSpy = jest.spyOn(messageService, 'error')

      effects.displayError$.subscribe(() => {
        setTimeout(() => {
          expect(errorSpy).toHaveBeenCalledWith({
            summaryKey: 'SCAFFOLD_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
          })
          done()
        }, 10)
      })

      actions$.next(ScaffoldSearchActions.scaffoldSearchResultsLoadingFailed({ error: null }))
    })

    it('should not display error for non-error actions', (done) => {
      const errorSpy = jest.spyOn(messageService, 'error')

      effects.displayError$.subscribe(() => {
        setTimeout(() => {
          expect(errorSpy).not.toHaveBeenCalled()
          done()
        }, 10)
      })

      actions$.next(ScaffoldSearchActions.resetButtonClicked())
    })
  })
})

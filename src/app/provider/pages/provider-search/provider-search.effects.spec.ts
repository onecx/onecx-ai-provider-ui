import { HttpEvent } from '@angular/common/http'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { provideMockActions } from '@ngrx/effects/testing'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import {
  ColumnType,
  DataTableColumn,
  ExportDataService,
  PortalDialogService,
  RowListGridData
} from '@onecx/angular-accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { of, ReplaySubject, throwError } from 'rxjs'
import { take } from 'rxjs/operators'

import { Provider, ProviderPageResult, ProviderService } from 'src/app/shared/generated'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import { ProviderCreateUpdateComponent } from './dialogs/provider-create-update/provider-create-update.component'
import { ProviderSearchActions } from './provider-search.actions'
import { ProviderSearchEffects } from './provider-search.effects'
import { ProviderSearchCriteria } from './provider-search.parameters'
import { initialState } from './provider-search.reducers'
import { ProviderSearchSelectors, selectProviderSearchViewModel } from './provider-search.selectors'
import { ProviderSearchViewModel } from './provider-search.viewmodel'

jest.mock('@onecx/ngrx-accelerator', () => {
  const actual = jest.requireActual('@onecx/ngrx-accelerator')
  return {
    ...actual,
    filterForNavigatedTo: () => (source: unknown) => source,
    filterOutQueryParamsHaveNotChanged: () => (source: unknown) => source,
    filterOutOnlyQueryParamsChanged: () => (source: unknown) => source
  }
})

// ACTION S11: Change test data in the whole document
describe('ProviderSearchEffects', () => {
  let actions$: ReplaySubject<Action>
  let effects: ProviderSearchEffects
  let store: MockStore<Store>
  let router: jest.Mocked<Router>
  let route: ActivatedRoute
  let providerService: jest.Mocked<ProviderService>
  let portalDialogService: jest.Mocked<PortalDialogService>
  let messageService: jest.Mocked<PortalMessageService>
  let exportDataService: jest.Mocked<ExportDataService>

  const mockCriteria: ProviderSearchCriteria = {
    name: 'test-name',
    description: 'test-description'
  }

  beforeEach(async () => {
    actions$ = new ReplaySubject(1)

    providerService = {
      createProvider: jest.fn(),
      updateProvider: jest.fn(),
      deleteProvider: jest.fn(),
      findProviderBySearchCriteria: jest.fn()
    } as unknown as jest.Mocked<ProviderService>

    router = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
      parseUrl: jest.fn(),
      events: of()
    } as unknown as jest.Mocked<Router>

    portalDialogService = {
      openDialog: jest.fn()
    } as unknown as jest.Mocked<PortalDialogService>

    messageService = {
      success: jest.fn(),
      error: jest.fn()
    } as unknown as jest.Mocked<PortalMessageService>

    exportDataService = {
      exportCsv: jest.fn()
    } as unknown as jest.Mocked<ExportDataService>

    route = {
      queryParams: of({}),
      snapshot: { queryParams: {} }
    } as unknown as ActivatedRoute

    await TestBed.configureTestingModule({
      providers: [
        ProviderSearchEffects,
        provideRouter([]),
        provideMockStore({
          initialState: { provider: { search: initialState } }
        }),
        provideMockActions(() => actions$),
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: ProviderService, useValue: providerService },
        { provide: PortalDialogService, useValue: portalDialogService },
        { provide: PortalMessageService, useValue: messageService },
        { provide: ExportDataService, useValue: exportDataService }
      ]
    }).compileComponents()

    store = TestBed.inject(MockStore)
    effects = TestBed.inject(ProviderSearchEffects)
  })

  beforeEach(() => {
    jest.resetAllMocks()
    ;(router.parseUrl as jest.Mock).mockImplementation((url: string) => ({
      toString: () => (url ? url.split('?')[0].split('#')[0] : '/search'),
      queryParams: {},
      fragment: null
    }))
  })

  describe('syncParamsToUrl$', () => {
    beforeEach(() => {
      store.overrideSelector(ProviderSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()
    })

    it('should navigate to update URL when criteria differs from query params', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')
      route.queryParams = of({ different: 'yes' })

      effects.syncParamsToUrl$.pipe(take(1)).subscribe(() => {
        expect(navigateSpy).toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))
    })

    it('should not navigate when criteria matches query params', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')
      route.queryParams = of(mockCriteria)

      effects.syncParamsToUrl$.pipe(take(1)).subscribe(() => {
        expect(navigateSpy).not.toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))
    })

    it('should navigate when resetButtonClicked action is triggered', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')
      route.queryParams = of({ something: 'else' })

      effects.syncParamsToUrl$.pipe(take(1)).subscribe(() => {
        expect(navigateSpy).toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.resetButtonClicked())
    })
  })

  describe('detailsButtonClicked$', () => {
    it('should navigate to details page with correct URL structure', (done) => {
      const testId = 'test-123'
      store.overrideSelector(selectUrl, '/search')
      store.refreshState()
      const navigateSpy = jest.spyOn(router, 'navigate')

      effects.detailsButtonClicked$.pipe(take(1)).subscribe(() => {
        expect(navigateSpy).toHaveBeenCalledWith(['/search', 'details', testId])
        done()
      })

      actions$.next(ProviderSearchActions.detailsButtonClicked({ id: testId }))
    })

    it('should dynamically clear query params and fragment from URL on detailsButtonClicked$', (done) => {
      const testId = 'test-456'
      store.overrideSelector(selectUrl, '/search?a=1#frag')
      store.refreshState()
      const mockUrlTree = {
        toString: jest.fn(() => '/search'),
        queryParams: { a: 1 },
        fragment: 'frag'
      }
      ;(router.parseUrl as jest.Mock).mockReturnValue(mockUrlTree)

      const emissions: { queryParams: unknown; fragment: unknown }[] = []
      emissions.push({ queryParams: { ...mockUrlTree.queryParams }, fragment: mockUrlTree.fragment })

      effects.detailsButtonClicked$.pipe(take(1)).subscribe(() => {
        emissions.push({ queryParams: { ...mockUrlTree.queryParams }, fragment: mockUrlTree.fragment })

        expect(emissions).toEqual([
          { queryParams: { a: 1 }, fragment: 'frag' },
          { queryParams: {}, fragment: null }
        ])
        done()
      })

      actions$.next(ProviderSearchActions.detailsButtonClicked({ id: testId }))
    })
  })

  describe('searchByUrl$ / performSearch', () => {
    beforeEach(() => {
      store.overrideSelector(ProviderSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()

      providerService.findProviderBySearchCriteria.mockReturnValue(
        of({
          stream: [{ id: '1', name: 'Item 1' }],
          totalElements: 1
        } as unknown as HttpEvent<ProviderPageResult>)
      )
    })

    it('should dispatch resultsLoadingFailed on search error', (done) => {
      const mockError = 'Search failed'
      providerService.findProviderBySearchCriteria.mockReturnValueOnce(throwError(() => mockError))

      effects
        .performSearch(mockCriteria)
        .pipe(take(1))
        .subscribe((action) => {
          expect(action.type).toEqual(ProviderSearchActions.providerSearchResultsLoadingFailed.type)
          expect(action).toEqual(ProviderSearchActions.providerSearchResultsLoadingFailed({ error: mockError }))
          done()
        })
    })

    it('should convert Date objects in search criteria before calling providerService', (done) => {
      const startDate = new Date(Date.UTC(2023, 0, 1))
      const endDate = new Date(Date.UTC(2023, 11, 31))
      const criteriaWithDate = { ...mockCriteria, startDate, endDate }
      const searchSpy = jest.spyOn(providerService, 'findProviderBySearchCriteria')

      effects
        .performSearch(criteriaWithDate)
        .pipe(take(1))
        .subscribe(() => {
          expect(searchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              startDate: '2023-01-01T00:00:00.000Z',
              endDate: '2023-12-31T00:00:00.000Z'
            })
          )
          done()
        })
    })

    it('should default missing response fields to empty results and zero counts', (done) => {
      providerService.findProviderBySearchCriteria.mockReturnValueOnce(of({} as unknown as HttpEvent<ProviderPageResult>))

      effects
        .performSearch(mockCriteria)
        .pipe(take(1))
        .subscribe((action) => {
          expect(action).toEqual(
            ProviderSearchActions.providerSearchResultsReceived({
              results: [],
              totalNumberOfResults: 0
            })
          )
          done()
        })
    })

    it('should dispatch providerSearchResultsReceived on successful search', (done) => {
      effects
        .performSearch(mockCriteria)
        .pipe(take(1))
        .subscribe((action) => {
          expect(action).toEqual(
            ProviderSearchActions.providerSearchResultsReceived({
              results: [{ id: '1', name: 'Item 1' }],
              totalNumberOfResults: 1
            })
          )
          done()
        })
    })

    it('should use latest criteria from store and call performSearch on routerNavigatedAction', (done) => {
      const criteriaFromStore = { name: 'fromStore' }
      store.overrideSelector(ProviderSearchSelectors.selectCriteria, criteriaFromStore)
      store.refreshState()

      const markerAction = ProviderSearchActions.providerSearchResultsLoadingFailed({ error: null })
      const performSearchSpy = jest.spyOn(effects, 'performSearch').mockReturnValue(of(markerAction))

      effects.searchByUrl$.pipe(take(1)).subscribe((action) => {
        expect(performSearchSpy).toHaveBeenCalledWith(criteriaFromStore)
        expect(action).toBe(markerAction)
        done()
      })

      actions$.next({ type: routerNavigatedAction.type })
    })
  })

  describe('exportData$', () => {
    it('should export CSV with correct parameters when export button is clicked', (done) => {
      const mockColumns: DataTableColumn[] = [
        {
          columnType: ColumnType.STRING,
          id: 'name',
          nameKey: 'PROVIDER_SEARCH.COLUMNS.NAME'
        }
      ]
      const mockResults: Partial<RowListGridData>[] = [
        { id: '1', name: 'Provider 1' },
        { id: '2', name: 'Provider 2' }
      ]
      const mockViewModel = { displayedColumns: mockColumns, results: mockResults }
      store.overrideSelector(selectProviderSearchViewModel, mockViewModel as ProviderSearchViewModel)

      effects.exportData$.pipe(take(1)).subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(mockColumns, mockResults, 'Provider.csv')
        done()
      })

      actions$.next(ProviderSearchActions.exportButtonClicked())
    })

    it('should handle export with empty results', (done) => {
      const mockColumns: DataTableColumn[] = [
        {
          columnType: ColumnType.STRING,
          id: 'name',
          nameKey: 'PROVIDER_SEARCH.COLUMNS.NAME'
        }
      ]
      const mockViewModel = {
        displayedColumns: mockColumns,
        results: [] as RowListGridData[]
      }
      store.overrideSelector(selectProviderSearchViewModel, mockViewModel as ProviderSearchViewModel)

      effects.exportData$.pipe(take(1)).subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(mockColumns, [], 'Provider.csv')
        done()
      })

      actions$.next(ProviderSearchActions.exportButtonClicked())
    })
  })

  describe('displayError$', () => {
    it('should display error message when ResultsLoadingFailed action is dispatched', (done) => {
      effects.displayError$.pipe(take(1)).subscribe(() => {
        expect(messageService.error).toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.providerSearchResultsLoadingFailed({ error: 'Test error' }))
    })

    it('should not display error message for actions not in errorMessages array', (done) => {
      setTimeout(() => {
        expect(messageService.error).not.toHaveBeenCalled()
        done()
      }, 0)

      actions$.next(ProviderSearchActions.resetButtonClicked())
    })
  })

  describe('refreshSearchAfterCreateUpdate$', () => {
    it('should dispatch ResultsLoadingFailed when search after create/update fails', (done) => {
      const mockError = 'Refresh search failed'

      store.overrideSelector(ProviderSearchSelectors.selectCriteria, {})
      providerService.findProviderBySearchCriteria.mockReturnValueOnce(throwError(() => mockError))

      effects.refreshSearchAfterCreateUpdate$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(ProviderSearchActions.providerSearchResultsLoadingFailed({ error: mockError }))
        done()
      })

      actions$.next(ProviderSearchActions.createProviderSucceeded())
    })

    it('should call performSearch when updateProviderSucceeded is dispatched', (done) => {
      const markerAction = ProviderSearchActions.providerSearchResultsLoadingFailed({ error: null })
      const performSearchSpy = jest.spyOn(effects, 'performSearch').mockReturnValue(of(markerAction))

      store.overrideSelector(ProviderSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()

      effects.refreshSearchAfterCreateUpdate$.pipe(take(1)).subscribe((action) => {
        expect(performSearchSpy).toHaveBeenCalledWith(mockCriteria)
        expect(action).toBe(markerAction)
        done()
      })

      actions$.next(ProviderSearchActions.updateProviderSucceeded())
    })
  })

  describe('editButtonClicked$', () => {
    const item = { id: 'provider-1', name: 'Provider 1', modificationCount: 3 }
    beforeEach(() => {
      store.overrideSelector(ProviderSearchSelectors.selectResults, [item])
      store.refreshState()
    })

    it('should open the update dialog with the item found in the results', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe(() => {
        expect(portalDialogService.openDialog).toHaveBeenCalledWith(
          'PROVIDER_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: ProviderCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: item
              }
            }
          },
          'PROVIDER_CREATE_UPDATE.UPDATE.FORM.SAVE',
          'PROVIDER_CREATE_UPDATE.UPDATE.FORM.CANCEL',
          { baseZIndex: 100 }
        )
        done()
      })

      actions$.next(ProviderSearchActions.editProviderButtonClicked({ id: 'provider-1' }))
    })

    it('should dispatch updateSucceeded and show a success message when update succeeds', (done) => {
      const dialog = {
        button: 'primary',
        result: { id: 'provider-1', name: 'Updated', description: 'desc', modificationCount: 3 }
      }

      portalDialogService.openDialog.mockReturnValue(of(dialog) as never)
      providerService.updateProvider.mockReturnValue(of({} as HttpEvent<Provider>))

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(providerService.updateProvider).toHaveBeenCalledWith('provider-1', {
          id: 'provider-1',
          name: 'Updated',
          description: 'desc',
          modificationCount: 3
        })
        expect(action.type).toBe(ProviderSearchActions.updateProviderSucceeded.type)
        expect(messageService.success).toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.editProviderButtonClicked({ id: 'provider-1' }))
    })

    it('should dispatch updateCancelled and not call the service when dialog is cancelled', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: null }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(ProviderSearchActions.updateProviderCancelled.type)
        expect(providerService.updateProvider).not.toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.editProviderButtonClicked({ id: 'provider-1' }))
    })

    it('should dispatch updateFailed and show an error message when API update call fails', (done) => {
      const dialog = { button: 'primary', result: { ...item } }
      portalDialogService.openDialog.mockReturnValue(of(dialog) as never)
      providerService.updateProvider.mockReturnValue(throwError(() => 'Update failed'))

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(ProviderSearchActions.updateProviderFailed({ error: 'Update failed' }))
        expect(messageService.error).toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.editProviderButtonClicked({ id: 'provider-1' }))
    })

    it('should dispatch updateFailed when dialog confirms but returns no result', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(ProviderSearchActions.updateProviderFailed.type)
        expect(providerService.updateProvider).not.toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.editProviderButtonClicked({ id: 'provider-1' }))
    })

    it('should dispatch updateFailed when the dialog confirms without an id', (done) => {
      portalDialogService.openDialog.mockReturnValue(
        of({ button: 'primary', result: { name: 'Updated', modificationCount: 1 } }) as never
      )

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(ProviderSearchActions.updateProviderFailed.type)
        expect(providerService.updateProvider).not.toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.editProviderButtonClicked({ id: 'provider-1' }))
    })
  })

  describe('createButtonClicked$', () => {
    it('should open the create dialog with the expected configuration', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe(() => {
        expect(portalDialogService.openDialog).toHaveBeenCalledWith(
          'PROVIDER_CREATE_UPDATE.CREATE.HEADER',
          {
            type: ProviderCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: {}
              }
            }
          },
          'PROVIDER_CREATE_UPDATE.CREATE.FORM.SAVE',
          'PROVIDER_CREATE_UPDATE.CREATE.FORM.CANCEL',
          { baseZIndex: 100 }
        )
        done()
      })

      actions$.next(ProviderSearchActions.createProviderButtonClicked())
    })

    it('should dispatch createSucceeded and show a success message when creation succeeds', (done) => {
      const dialog = { button: 'primary', result: { name: 'New' } }
      portalDialogService.openDialog.mockReturnValue(of(dialog) as never)
      providerService.createProvider.mockReturnValue(of({}) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(ProviderSearchActions.createProviderSucceeded.type)
        expect(messageService.success).toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.createProviderButtonClicked())
    })

    it('should dispatch createCancelled and not call the service when dialog is cancelled', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: { name: 'x' } }) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(ProviderSearchActions.createProviderCancelled.type)
        expect(providerService.createProvider).not.toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.createProviderButtonClicked())
    })

    it('should dispatch createCancelled when the dialog is dismissed without a result', (done) => {
      portalDialogService.openDialog.mockReturnValue(of(undefined) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(ProviderSearchActions.createProviderCancelled())
        done()
      })

      actions$.next(ProviderSearchActions.createProviderButtonClicked())
    })

    it('should dispatch createFailed when dialog confirms but returns no result', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toBe(ProviderSearchActions.createProviderFailed.type)
        expect(providerService.createProvider).not.toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.createProviderButtonClicked())
    })

    it('should dispatch createFailed and show an error message when API create call fails', (done) => {
      const dialog = { button: 'primary', result: { name: 'New' } }
      portalDialogService.openDialog.mockReturnValue(of(dialog) as never)
      providerService.createProvider.mockReturnValue(throwError(() => 'API Error'))

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(ProviderSearchActions.createProviderFailed({ error: 'API Error' }))
        expect(messageService.error).toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.createProviderButtonClicked())
    })
  })

  describe('editDetailsButtonClicked$', () => {
    const item = { id: 'provider-1', name: 'Provider 1', description: 'desc' }

    beforeEach(() => {
      store.overrideSelector(ProviderSearchSelectors.selectResults, [item])
      store.refreshState()
    })

    it('should update the provider from results and dispatch updateProviderSucceeded', (done) => {
      providerService.updateProvider.mockReturnValue(of({} as HttpEvent<Provider>))

      effects.editDetailsButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(providerService.updateProvider).toHaveBeenCalledWith('provider-1', item)
        expect(messageService.success).toHaveBeenCalledWith({
          summaryKey: 'PROVIDER_CREATE_UPDATE.UPDATE.SUCCESS'
        })
        expect(action).toEqual(ProviderSearchActions.updateProviderSucceeded())
        done()
      })

      actions$.next(ProviderSearchActions.editProviderDetailsButtonClicked({ id: 'provider-1' }))
    })

    it('should dispatch updateProviderFailed when result id is missing', (done) => {
      store.overrideSelector(ProviderSearchSelectors.selectResults, [{ id: null as unknown as string, name: 'No Id' }])
      store.refreshState()

      effects.editDetailsButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toEqual(ProviderSearchActions.updateProviderFailed.type)
        expect(providerService.updateProvider).not.toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.editProviderDetailsButtonClicked({ id: null as unknown as string }))
    })

    it('should dispatch updateProviderFailed when result is not found', (done) => {
      store.overrideSelector(ProviderSearchSelectors.selectResults, [])
      store.refreshState()

      effects.editDetailsButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toEqual(ProviderSearchActions.updateProviderFailed.type)
        done()
      })

      actions$.next(ProviderSearchActions.editProviderDetailsButtonClicked({ id: 'missing' }))
    })

    it('should dispatch updateProviderFailed when the update call fails', (done) => {
      providerService.updateProvider.mockReturnValue(throwError(() => 'Update failed'))

      effects.editDetailsButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(ProviderSearchActions.updateProviderFailed({ error: 'Update failed' }))
        expect(messageService.error).toHaveBeenCalledWith({
          summaryKey: 'PROVIDER_CREATE_UPDATE.UPDATE.ERROR'
        })
        done()
      })

      actions$.next(ProviderSearchActions.editProviderDetailsButtonClicked({ id: 'provider-1' }))
    })
  })

  describe('refreshSearchAfterDelete$', () => {
    it('should call performSearch when deleteProviderSucceeded is dispatched', (done) => {
      const markerAction = ProviderSearchActions.providerSearchResultsLoadingFailed({ error: null })
      const performSearchSpy = jest.spyOn(effects, 'performSearch').mockReturnValue(of(markerAction))

      store.overrideSelector(ProviderSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()

      effects.refreshSearchAfterDelete$.pipe(take(1)).subscribe((action) => {
        expect(performSearchSpy).toHaveBeenCalledWith(mockCriteria)
        expect(action).toBe(markerAction)
        done()
      })

      actions$.next(ProviderSearchActions.deleteProviderSucceeded())
    })
  })

  describe('deleteButtonClicked$', () => {
    const item = { id: 'provider-1', name: 'Provider 1' }

    beforeEach(() => {
      store.overrideSelector(ProviderSearchSelectors.selectResults, [item])
      store.refreshState()
    })

    it('should dispatch deleteProviderCancelled when the dialog is cancelled', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary' }) as never)

      effects.deleteButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(ProviderSearchActions.deleteProviderCancelled())
        expect(providerService.deleteProvider).not.toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.deleteProviderButtonClicked({ id: 'provider-1' }))
    })

    it('should dispatch deleteProviderCancelled when the dialog is dismissed', (done) => {
      portalDialogService.openDialog.mockReturnValue(of(undefined) as never)

      effects.deleteButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(ProviderSearchActions.deleteProviderCancelled())
        done()
      })

      actions$.next(ProviderSearchActions.deleteProviderButtonClicked({ id: 'provider-1' }))
    })

    it('should delete the provider and dispatch deleteProviderSucceeded on success', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary' }) as never)
      providerService.deleteProvider.mockReturnValue(of({} as HttpEvent<unknown>))

      effects.deleteButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(providerService.deleteProvider).toHaveBeenCalledWith('provider-1')
        expect(messageService.success).toHaveBeenCalledWith({
          summaryKey: 'PROVIDER_DELETE.SUCCESS'
        })
        expect(action).toEqual(ProviderSearchActions.deleteProviderSucceeded())
        done()
      })

      actions$.next(ProviderSearchActions.deleteProviderButtonClicked({ id: 'provider-1' }))
    })

    it('should dispatch deleteProviderFailed when item to delete is missing', (done) => {
      store.overrideSelector(ProviderSearchSelectors.selectResults, [])
      store.refreshState()
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary' }) as never)

      effects.deleteButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toEqual(ProviderSearchActions.deleteProviderFailed.type)
        expect(providerService.deleteProvider).not.toHaveBeenCalled()
        done()
      })

      actions$.next(ProviderSearchActions.deleteProviderButtonClicked({ id: 'missing' }))
    })

    it('should dispatch deleteProviderFailed when the delete call fails', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary' }) as never)
      providerService.deleteProvider.mockReturnValue(throwError(() => 'Delete failed'))

      effects.deleteButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(ProviderSearchActions.deleteProviderFailed({ error: 'Delete failed' }))
        expect(messageService.error).toHaveBeenCalledWith({
          summaryKey: 'PROVIDER_DELETE.ERROR'
        })
        done()
      })

      actions$.next(ProviderSearchActions.deleteProviderButtonClicked({ id: 'provider-1' }))
    })
  })

  describe('rehydrateChartVisibility$', () => {
    it('should dispatch chartVisibilityRehydrated with true when localStorage is true', (done) => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('true')

      effects.rehydrateChartVisibility$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(ProviderSearchActions.chartVisibilityRehydrated({ visible: true }))
        done()
      })

      actions$.next({ type: routerNavigatedAction.type })
    })

    it('should dispatch chartVisibilityRehydrated with false when localStorage is not true', (done) => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('false')

      effects.rehydrateChartVisibility$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(ProviderSearchActions.chartVisibilityRehydrated({ visible: false }))
        done()
      })

      actions$.next({ type: routerNavigatedAction.type })
    })
  })

  describe('saveChartVisibility$', () => {
    it('should persist chart visibility to localStorage', (done) => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
      store.overrideSelector(ProviderSearchSelectors.selectChartVisible, true)
      store.refreshState()

      effects.saveChartVisibility$.pipe(take(1)).subscribe(() => {
        expect(setItemSpy).toHaveBeenCalledWith('ProviderChartVisibility', 'true')
        done()
      })

      actions$.next(ProviderSearchActions.chartVisibilityToggled())
    })
  })

  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>
})

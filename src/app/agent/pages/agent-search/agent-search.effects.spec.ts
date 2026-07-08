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

import { AgentService, SearchAgentResponse } from 'src/app/shared/generated'
import { agentSearchActions } from './agent-search.actions'
import { AgentSearchEffects } from './agent-search.effects'
import { AgentSearchCriteria } from './agent-search.parameters'
import { initialState } from './agent-search.reducers'
import { agentSearchSelectors, selectAgentSearchViewModel } from './agent-search.selectors'
import { AgentSearchViewModel } from './agent-search.viewmodel'

jest.mock('@onecx/ngrx-accelerator', () => {
  const actual = jest.requireActual('@onecx/ngrx-accelerator')
  return {
    ...actual,
    filterForNavigatedTo: () => (source: unknown) => source,
    filterOutQueryParamsHaveNotChanged: () => (source: unknown) => source
  }
})

// ACTION S11: Change test data in the whole document
describe('AgentSearchEffects', () => {
  let actions$: ReplaySubject<Action>
  let effects: AgentSearchEffects
  let store: MockStore<Store>
  let router: jest.Mocked<Router>
  let route: ActivatedRoute
  let agentService: jest.Mocked<AgentService>
  let portalDialogService: jest.Mocked<PortalDialogService>
  let messageService: jest.Mocked<PortalMessageService>
  let exportDataService: jest.Mocked<ExportDataService>

  const mockCriteria: AgentSearchCriteria = { name: 'test' }

  beforeEach(async () => {
    actions$ = new ReplaySubject(1)

    agentService = {
      createAgent: jest.fn(),
      updateAgentById: jest.fn(),
      deleteAgentById: jest.fn(),
      findAgentBySearchCriteria: jest.fn()
    } as unknown as jest.Mocked<AgentService>

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
        AgentSearchEffects,
        provideRouter([]),
        provideMockStore({
          initialState: { AgentSearch: initialState }
        }),
        provideMockActions(() => actions$),
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: AgentService, useValue: agentService },
        { provide: PortalDialogService, useValue: portalDialogService },
        { provide: PortalMessageService, useValue: messageService },
        { provide: ExportDataService, useValue: exportDataService }
      ]
    }).compileComponents()

    store = TestBed.inject(MockStore)
    effects = TestBed.inject(AgentSearchEffects)
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
      store.overrideSelector(agentSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()
    })

    it('should navigate to update URL when criteria differs from query params', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')
      route.queryParams = of({ different: 'yes' })

      effects.syncParamsToUrl$.pipe(take(1)).subscribe(() => {
        expect(navigateSpy).toHaveBeenCalled()
        done()
      })

      actions$.next(agentSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))
    })

    it('should not navigate when criteria matches query params', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')
      route.queryParams = of(mockCriteria)

      effects.syncParamsToUrl$.pipe(take(1)).subscribe(() => {
        expect(navigateSpy).not.toHaveBeenCalled()
        done()
      })

      actions$.next(agentSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))
    })

    it('should navigate when resetButtonClicked action is triggered', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')
      route.queryParams = of({ something: 'else' })

      effects.syncParamsToUrl$.pipe(take(1)).subscribe(() => {
        expect(navigateSpy).toHaveBeenCalled()
        done()
      })

      actions$.next(agentSearchActions.resetButtonClicked())
    })
  })

  describe('searchByUrl$ / performSearch', () => {
    beforeEach(() => {
      store.overrideSelector(agentSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()

      agentService.findAgentBySearchCriteria.mockReturnValue(
        of({
          stream: [{ id: '1', name: 'Item 1' }],
          content: [{ id: '1', name: 'Item 1', imagePath: '' }],
          size: 10,
          number: 0,
          totalElements: 1,
          totalPages: 1
        } as unknown as HttpEvent<SearchAgentResponse>)
      )
    })

    it('should dispatch resultsLoadingFailed on search error', (done) => {
      const mockError = 'Search failed'
      agentService.findAgentBySearchCriteria.mockReturnValueOnce(throwError(() => mockError))

      effects
        .performSearch(mockCriteria)
        .pipe(take(1))
        .subscribe((action) => {
          expect(action.type).toEqual(agentSearchActions.agentSearchResultsLoadingFailed.type)
          expect(action).toEqual(agentSearchActions.agentSearchResultsLoadingFailed({ error: mockError }))
          done()
        })
    })

    it('should convert Date objects in search criteria before calling agentService', (done) => {
      const criteriaWithDate = { ...mockCriteria, startDate: new Date('2023-01-01'), endDate: new Date('2023-12-31') }
      const searchSpy = jest.spyOn(agentService, 'findAgentBySearchCriteria')

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

    it('should use latest criteria from store and call performSearch on routerNavigatedAction', (done) => {
      const criteriaFromStore = { name: 'fromStore' }
      store.overrideSelector(agentSearchSelectors.selectCriteria, criteriaFromStore)
      store.refreshState()

      const markerAction = agentSearchActions.agentSearchResultsLoadingFailed({ error: null })
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
    const cases = [
      {
        desc: 'should handle export with empty displayed columns',
        viewModel: {
          results: [{ id: '1', name: 'Context 1', imagePath: '' }],
          resultComponentState: { displayedColumns: undefined }
        } as Partial<AgentSearchViewModel>
      },
      {
        desc: 'should handle export with null resultComponentState',
        viewModel: {
          results: [{ id: '1', name: 'Context 1', imagePath: '' }],
          resultComponentState: null
        } as Partial<AgentSearchViewModel>
      }
    ]

    cases.forEach(({ desc, viewModel }) => {
      it(desc, (done) => {
        store.overrideSelector(selectAgentSearchViewModel, viewModel as AgentSearchViewModel)

        effects.exportData$.pipe(take(1)).subscribe(() => {
          expect(exportDataService.exportCsv).toHaveBeenCalledWith([], viewModel.results, 'agent.csv')
          done()
        })

        actions$.next(agentSearchActions.exportButtonClicked())
      })
    })

    it('should export CSV with correct parameters when export button is clicked', (done) => {
      const mockColumns: DataTableColumn[] = [
        {
          columnType: ColumnType.STRING,
          id: 'name',
          nameKey: 'AGENT_SEARCH.RESULTS.CHANGE_ME'
        }
      ]
      const mockResults: Partial<RowListGridData>[] = [
        { id: '1', name: 'Context 1' },
        { id: '2', name: 'Context 2' }
      ]
      const mockViewModel = { resultComponentState: { displayedColumns: mockColumns }, results: mockResults }
      store.overrideSelector(selectAgentSearchViewModel, mockViewModel as AgentSearchViewModel)

      effects.exportData$.pipe(take(1)).subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(mockColumns, mockResults, 'agent.csv')
        done()
      })

      actions$.next(agentSearchActions.exportButtonClicked())
    })

    it('should handle export with empty results', (done) => {
      const mockColumns: DataTableColumn[] = [
        {
          columnType: ColumnType.STRING,
          id: 'name',
          nameKey: 'AGENT_SEARCH.RESULTS.CHANGE_ME'
        }
      ]
      const mockViewModel = {
        resultComponentState: { displayedColumns: mockColumns },
        results: [] as RowListGridData[]
      }
      store.overrideSelector(selectAgentSearchViewModel, mockViewModel as AgentSearchViewModel)

      effects.exportData$.pipe(take(1)).subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(mockColumns, [], 'agent.csv')
        done()
      })

      actions$.next(agentSearchActions.exportButtonClicked())
    })
  })

  describe('displayError$', () => {
    it('should display error message when ResultsLoadingFailed action is dispatched', (done) => {
      effects.displayError$.pipe(take(1)).subscribe(() => {
        expect(messageService.error).toHaveBeenCalled()
        done()
      })

      actions$.next(agentSearchActions.agentSearchResultsLoadingFailed({ error: 'Test error' }))
    })
  })

  describe('navigateToOrderDetailsPage$', () => {
    it('should navigate to details page with correct URL structure', (done) => {
      const testId = 'test-123'
      const navigateSpy = router
        ? jest.spyOn(router, 'navigate')
        : // eslint-disable-next-line @typescript-eslint/no-empty-function
          { mock: { calls: [] }, toHaveBeenCalledWith: () => {} }

      effects.navigateToOrderDetailsPage$.pipe(take(1)).subscribe(() => {
        if (router) {
          expect(navigateSpy).toHaveBeenCalledWith(['/search', 'details', testId])
        }
        done()
      })

      actions$.next(agentSearchActions.detailsButtonClicked({ id: testId }))
    })

    it('should dynamically clear query params and fragment from URL on navigateToOrderDetailsPage$', (done) => {
      const testId = 'test-456'
      const mockUrlTree = {
        toString: jest.fn(() => '/search'),
        queryParams: { a: 1 },
        fragment: 'frag'
      }
      ;(router.parseUrl as jest.Mock).mockReturnValue(mockUrlTree)

      const emissions: { queryParams: unknown; fragment: unknown }[] = []
      emissions.push({ queryParams: { ...mockUrlTree.queryParams }, fragment: mockUrlTree.fragment })

      effects.navigateToOrderDetailsPage$.pipe(take(1)).subscribe(() => {
        emissions.push({ queryParams: { ...mockUrlTree.queryParams }, fragment: mockUrlTree.fragment })

        expect(emissions).toEqual([
          { queryParams: { a: 1 }, fragment: 'frag' },
          { queryParams: {}, fragment: null }
        ])
        done()
      })

      actions$.next(agentSearchActions.detailsButtonClicked({ id: testId }))
    })
  })

  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>
})

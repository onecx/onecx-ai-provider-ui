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

import { Agent, AgentPageResult, AgentService } from 'src/app/shared/generated'
import { agentSearchActions } from './agent-search.actions'
import { AgentCreateUpdateComponent } from './dialogs/agent-create-update/agent-create-update.component'
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
      updateAgent: jest.fn(),
      deleteAgent: jest.fn(),
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
        } as unknown as HttpEvent<AgentPageResult>)
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

    it('should default missing response fields to empty results and zero counts', (done) => {
      agentService.findAgentBySearchCriteria.mockReturnValueOnce(of({} as unknown as HttpEvent<AgentPageResult>))

      effects
        .performSearch(mockCriteria)
        .pipe(take(1))
        .subscribe((action) => {
          expect(action).toEqual(
            agentSearchActions.agentSearchResultsReceived({
              stream: [],
              size: 0,
              number: 0,
              totalElements: 0,
              totalPages: 0
            })
          )
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

  describe('refreshSearchAfterCreateUpdate$', () => {
    beforeEach(() => {
      store.overrideSelector(agentSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()
    })

    it('should call performSearch with current criteria when createAgentSucceeded is dispatched', (done) => {
      const markerAction = agentSearchActions.agentSearchResultsLoadingFailed({ error: null })
      const performSearchSpy = jest.spyOn(effects, 'performSearch').mockReturnValue(of(markerAction))

      effects.refreshSearchAfterCreateUpdate$.pipe(take(1)).subscribe((action) => {
        expect(performSearchSpy).toHaveBeenCalledWith(mockCriteria)
        expect(action).toBe(markerAction)
        done()
      })

      actions$.next(agentSearchActions.createAgentSucceeded())
    })

    it('should call performSearch with current criteria when updateAgentSucceeded is dispatched', (done) => {
      const markerAction = agentSearchActions.agentSearchResultsLoadingFailed({ error: null })
      const performSearchSpy = jest.spyOn(effects, 'performSearch').mockReturnValue(of(markerAction))

      effects.refreshSearchAfterCreateUpdate$.pipe(take(1)).subscribe((action) => {
        expect(performSearchSpy).toHaveBeenCalledWith(mockCriteria)
        expect(action).toBe(markerAction)
        done()
      })

      actions$.next(agentSearchActions.updateAgentSucceeded())
    })
  })

  describe('createButtonClicked$', () => {
    it('should open the create dialog with the expected configuration', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe(() => {
        expect(portalDialogService.openDialog).toHaveBeenCalledWith(
          'AGENT_CREATE_UPDATE.CREATE.HEADER',
          {
            type: AgentCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: undefined
              }
            }
          },
          'AGENT_CREATE_UPDATE.CREATE.FORM.SAVE',
          'AGENT_CREATE_UPDATE.CREATE.FORM.CANCEL',
          { baseZIndex: 100 }
        )
        done()
      })

      actions$.next(agentSearchActions.createAgentButtonClicked())
    })

    it('should dispatch createAgentCancelled when the dialog is cancelled', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: { name: 'x' } }) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(agentSearchActions.createAgentCancelled())
        expect(agentService.createAgent).not.toHaveBeenCalled()
        done()
      })

      actions$.next(agentSearchActions.createAgentButtonClicked())
    })

    it('should dispatch createAgentCancelled when the dialog is dismissed without a result', (done) => {
      portalDialogService.openDialog.mockReturnValue(of(undefined) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(agentSearchActions.createAgentCancelled())
        done()
      })

      actions$.next(agentSearchActions.createAgentButtonClicked())
    })

    it('should dispatch createAgentFailed when the dialog confirms without a name', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: {} }) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toEqual(agentSearchActions.createAgentFailed.type)
        expect(agentService.createAgent).not.toHaveBeenCalled()
        done()
      })

      actions$.next(agentSearchActions.createAgentButtonClicked())
    })

    it('should dispatch createAgentFailed when the dialog confirms but returns no result', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toEqual(agentSearchActions.createAgentFailed.type)
        expect(agentService.createAgent).not.toHaveBeenCalled()
        done()
      })

      actions$.next(agentSearchActions.createAgentButtonClicked())
    })

    it('should create the agent and dispatch createAgentSucceeded on success', (done) => {
      portalDialogService.openDialog.mockReturnValue(
        of({ button: 'primary', result: { name: 'New Agent', description: 'desc' } }) as never
      )
      agentService.createAgent.mockReturnValue(of({} as unknown as HttpEvent<Agent>))

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(agentService.createAgent).toHaveBeenCalledWith({ name: 'New Agent', description: 'desc' })
        expect(messageService.success).toHaveBeenCalledWith({ summaryKey: 'AGENT_CREATE_UPDATE.CREATE.SUCCESS' })
        expect(action).toEqual(agentSearchActions.createAgentSucceeded())
        done()
      })

      actions$.next(agentSearchActions.createAgentButtonClicked())
    })

    it('should dispatch createAgentFailed and show an error message when the create call fails', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: { name: 'New Agent' } }) as never)
      agentService.createAgent.mockReturnValue(throwError(() => 'API Error'))

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(agentSearchActions.createAgentFailed({ error: 'API Error' }))
        expect(messageService.error).toHaveBeenCalledWith({ summaryKey: 'AGENT_CREATE_UPDATE.CREATE.ERROR' })
        done()
      })

      actions$.next(agentSearchActions.createAgentButtonClicked())
    })
  })

  describe('editButtonClicked$', () => {
    const item = { id: 'agent-1', name: 'Agent 1', modificationCount: 3 }

    beforeEach(() => {
      store.overrideSelector(agentSearchSelectors.selectResults, [item])
      store.refreshState()
    })

    it('should open the update dialog with the item found in the results', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe(() => {
        expect(portalDialogService.openDialog).toHaveBeenCalledWith(
          'AGENT_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: AgentCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: item
              }
            }
          },
          'AGENT_CREATE_UPDATE.UPDATE.FORM.SAVE',
          'AGENT_CREATE_UPDATE.UPDATE.FORM.CANCEL',
          { baseZIndex: 100 }
        )
        done()
      })

      actions$.next(agentSearchActions.editAgentButtonClicked({ id: 'agent-1' }))
    })

    it('should dispatch updateAgentCancelled when the dialog is cancelled', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: null }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(agentSearchActions.updateAgentCancelled())
        expect(agentService.updateAgent).not.toHaveBeenCalled()
        done()
      })

      actions$.next(agentSearchActions.editAgentButtonClicked({ id: 'agent-1' }))
    })

    it('should dispatch updateAgentFailed when the dialog confirms without an id', (done) => {
      portalDialogService.openDialog.mockReturnValue(
        of({ button: 'primary', result: { modificationCount: 1 } }) as never
      )

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toEqual(agentSearchActions.updateAgentFailed.type)
        expect(agentService.updateAgent).not.toHaveBeenCalled()
        done()
      })

      actions$.next(agentSearchActions.editAgentButtonClicked({ id: 'agent-1' }))
    })

    it('should dispatch updateAgentFailed when the dialog confirms but returns no result', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toEqual(agentSearchActions.updateAgentFailed.type)
        expect(agentService.updateAgent).not.toHaveBeenCalled()
        done()
      })

      actions$.next(agentSearchActions.editAgentButtonClicked({ id: 'agent-1' }))
    })

    it('should dispatch updateAgentFailed when the dialog confirms without a modificationCount', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: { id: 'agent-1' } }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toEqual(agentSearchActions.updateAgentFailed.type)
        expect(agentService.updateAgent).not.toHaveBeenCalled()
        done()
      })

      actions$.next(agentSearchActions.editAgentButtonClicked({ id: 'agent-1' }))
    })

    it('should update the agent and dispatch updateAgentSucceeded on success', (done) => {
      portalDialogService.openDialog.mockReturnValue(
        of({
          button: 'primary',
          result: { id: 'agent-1', name: 'Updated', description: 'desc', modificationCount: 3 }
        }) as never
      )
      agentService.updateAgent.mockReturnValue(of({} as unknown as HttpEvent<Agent>))

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(agentService.updateAgent).toHaveBeenCalledWith('agent-1', {
          modificationCount: 3,
          name: 'Updated',
          description: 'desc'
        })
        expect(messageService.success).toHaveBeenCalledWith({ summaryKey: 'AGENT_CREATE_UPDATE.UPDATE.SUCCESS' })
        expect(action).toEqual(agentSearchActions.updateAgentSucceeded())
        done()
      })

      actions$.next(agentSearchActions.editAgentButtonClicked({ id: 'agent-1' }))
    })

    it('should dispatch updateAgentFailed and show an error message when the update call fails', (done) => {
      portalDialogService.openDialog.mockReturnValue(
        of({ button: 'primary', result: { id: 'agent-1', name: 'Updated', modificationCount: 3 } }) as never
      )
      agentService.updateAgent.mockReturnValue(throwError(() => 'Update failed'))

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(agentSearchActions.updateAgentFailed({ error: 'Update failed' }))
        expect(messageService.error).toHaveBeenCalledWith({ summaryKey: 'AGENT_CREATE_UPDATE.UPDATE.ERROR' })
        done()
      })

      actions$.next(agentSearchActions.editAgentButtonClicked({ id: 'agent-1' }))
    })
  })

  // <<SPEC-EXTENSIONS-MARKER-!!!-DO-NOT-REMOVE-!!!>>
})

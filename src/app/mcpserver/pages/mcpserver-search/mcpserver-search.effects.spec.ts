import { TestBed } from '@angular/core/testing'
import { HttpEvent } from '@angular/common/http'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { provideMockActions } from '@ngrx/effects/testing'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { MonoTypeOperatorFunction, ReplaySubject, map, of, take, throwError, firstValueFrom } from 'rxjs'

import { ExportDataService, PortalDialogService } from '@onecx/angular-accelerator'
import { PortalMessageServiceMock, providePortalMessageServiceMock } from '@onecx/angular-integration-interface/mocks'

import { Tool, ToolPageResult, ToolService, ToolType } from 'src/app/shared/generated'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import { McpserverCreateUpdateComponent } from './dialogs/mcpserver-create-update/mcpserver-create-update.component'
import { MCPServerSearchActions } from './mcpserver-search.actions'
import { MCPServerSearchEffects } from './mcpserver-search.effects'
import { MCPServerSearchCriteria } from './mcpserver-search.parameters'
import { initialState } from './mcpserver-search.reducers'
import { mcpserverSearchSelectors, selectMCPServerSearchViewModel } from './mcpserver-search.selectors'
import { MCPServerSearchViewModel } from './mcpserver-search.viewmodel'

jest.mock('@onecx/ngrx-accelerator', () => {
  const actual = jest.requireActual('@onecx/ngrx-accelerator')
  const passThroughOp = <T>(): MonoTypeOperatorFunction<T> => map((x: T) => x)
  return {
    ...actual,
    filterForNavigatedTo: jest.fn((...args: unknown[]) => {
      void args
      return passThroughOp()
    }),
    filterOutQueryParamsHaveNotChanged: jest.fn((...args: unknown[]) => {
      void args
      return passThroughOp()
    })
  }
})

describe('MCPServerSearchEffects', () => {
  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }

  let actions$: ReplaySubject<unknown>
  let effects: MCPServerSearchEffects
  let store: MockStore<Store>
  let router: jest.Mocked<Router>
  let route: ActivatedRoute
  let mcpService: jest.Mocked<ToolService>
  let messageService: PortalMessageServiceMock
  let exportDataService: jest.Mocked<ExportDataService>
  let portalDialogService: jest.Mocked<PortalDialogService>

  const mockCriteria: MCPServerSearchCriteria = {
    name: 'test-name',
    description: 'test-description'
  }

  beforeEach(async () => {
    actions$ = new ReplaySubject(1)

    mcpService = {
      findToolByCriteria: jest.fn(),
      createTool: jest.fn(),
      updateToolById: jest.fn()
    } as unknown as jest.Mocked<ToolService>

    portalDialogService = {
      openDialog: jest.fn()
    } as unknown as jest.Mocked<PortalDialogService>

    router = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
      parseUrl: jest.fn().mockImplementation((url: string) => {
        const urlParts = url.split('?')[0]
        return {
          queryParams: {},
          fragment: null,
          toString: () => urlParts
        }
      }),
      events: of()
    } as unknown as jest.Mocked<Router>

    // messageService will be injected as PortalMessageServiceMock

    exportDataService = {
      exportCsv: jest.fn()
    } as unknown as jest.Mocked<ExportDataService>

    route = {
      queryParams: of({
        name: 'test-name',
        description: 'test-description'
      }),
      snapshot: {
        queryParams: {}
      }
    } as unknown as ActivatedRoute

    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      providers: [
        { provide: PortalDialogService, useValue: portalDialogService },
        MCPServerSearchEffects,
        provideMockStore({
          initialState: { mcpserver: { search: initialState } }
        }),
        provideMockActions(() => actions$),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: ToolService, useValue: mcpService },
        { provide: ExportDataService, useValue: exportDataService },
        providePortalMessageServiceMock()
      ]
    }).compileComponents()

    messageService = TestBed.inject(PortalMessageServiceMock)
    // Instead of letting Angular DI try to resolve the @SkipSelf() ActivatedRoute (which has no parent injector in TestBed),
    // construct the effect instance manually and pass the desired route object as the "parent".
    const { Actions } = await import('@ngrx/effects')
    const ngrxActions = new Actions(actions$ as any)
    effects = new MCPServerSearchEffects(
      ngrxActions,
      route as any,
      mcpService as any,
      portalDialogService as any,
      router as any,
      TestBed.inject(MockStore),
      messageService as any,
      exportDataService as any
    )
    store = TestBed.inject(MockStore)
  })

  describe('syncParamsToUrl$', () => {
    beforeEach(() => {
      store.overrideSelector(mcpserverSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()
    })

    it('should navigate to update URL when criteria differs from query params', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')

      route.queryParams = of({
        name: 'different-name',
        description: 'different-description'
      })

      actions$.next(MCPServerSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))

      effects.syncParamsToUrl$.subscribe(() => {
        expect(navigateSpy).toHaveBeenCalledWith([], {
          relativeTo: route,
          queryParams: mockCriteria,
          replaceUrl: true,
          onSameUrlNavigation: 'ignore'
        })
        done()
      })
    })

    it('should not navigate when criteria matches query params', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')

      route.queryParams = of(mockCriteria)

      actions$.next(MCPServerSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))

      effects.syncParamsToUrl$.subscribe(() => {
        expect(navigateSpy).not.toHaveBeenCalled()
        done()
      })
    })

    it('should navigate when resetButtonClicked action is triggered', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')

      route.queryParams = of({ name: 'different-name' })

      actions$.next(MCPServerSearchActions.resetButtonClicked())

      effects.syncParamsToUrl$.subscribe(() => {
        expect(navigateSpy).toHaveBeenCalledWith([], {
          relativeTo: route,
          queryParams: mockCriteria,
          replaceUrl: true,
          onSameUrlNavigation: 'ignore'
        })
        done()
      })
    })
  })

  describe('detailsButtonClicked$', () => {
    beforeEach(() => {
      store.overrideSelector(selectUrl, '/search?param=value#fragment')
      store.refreshState()
    })

    it('should navigate to details page with correct URL structure', (done) => {
      const testId = 'test-123'
      const navigateSpy = jest.spyOn(router, 'navigate')

      actions$.next(MCPServerSearchActions.detailsButtonClicked({ id: testId }))

      effects.detailsButtonClicked$.subscribe(() => {
        expect(navigateSpy).toHaveBeenCalledWith(['/search', 'details', testId])
        done()
      })
    })

    it('should clear query params and fragment from URL', (done) => {
      const testId = 'test-456'
      const parseUrlSpy = jest.spyOn(router, 'parseUrl')

      const mockUrlTree = {
        toString: jest.fn(() => '/search'),
        queryParams: { param: 'value' },
        fragment: 'fragment'
      }

      parseUrlSpy.mockReturnValue(mockUrlTree as never)

      actions$.next(MCPServerSearchActions.detailsButtonClicked({ id: testId }))

      effects.detailsButtonClicked$.subscribe(() => {
        expect(mockUrlTree.queryParams).toEqual({})
        expect(mockUrlTree.fragment).toBeNull()
        done()
      })
    })
  })

  describe('searchByUrl$', () => {
    beforeEach(() => {
      store.overrideSelector(mcpserverSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()

      mcpService.findToolByCriteria.mockReturnValue(
        of({
          stream: [{ id: '1', name: 'Test MCP Server' }],
          size: 10,
          number: 0,
          totalElements: 1,
          totalPages: 1
        }) as never
      )
    })

    describe('createButtonClicked$', () => {
      it('should include MCP type in create request payload', async () => {
        const portalDialogService = TestBed.inject(PortalDialogService) as jest.Mocked<PortalDialogService>
        portalDialogService.openDialog.mockReturnValue(
          of({
            button: 'primary',
            result: {
              name: 'my-mcp-tool',
              description: 'my description'
            }
          }) as never
        )
        mcpService.createTool = jest.fn().mockReturnValue(of({ id: '1' }) as never)

        const actionPromise = firstValueFrom(effects.createButtonClicked$)

        actions$.next(MCPServerSearchActions.createMcpserverButtonClicked())

        const action = await actionPromise
        expect(mcpService.createTool).toHaveBeenCalledWith({
          name: 'my-mcp-tool',
          description: 'my description',
          type: ToolType.Mcp
        })
        expect(action).toEqual(MCPServerSearchActions.createMcpserverSucceeded())
      })
    })

    it('should call performSearch with criteria from store on router navigation', (done) => {
      const expectedAction = MCPServerSearchActions.mcpserverSearchResultsReceived({
        stream: [],
        size: 0,
        number: 0,
        totalElements: 0,
        totalPages: 0
      })

      const performSpy = jest.spyOn(effects, 'performSearch').mockReturnValue(of(expectedAction) as any)

      actions$.next({ type: routerNavigatedAction.type })

      effects.searchByUrl$.subscribe((action) => {
        expect(performSpy).toHaveBeenCalledWith(mockCriteria)
        expect(action).toEqual(expectedAction)
        done()
      })
    })

    it('should call performSearch and dispatch mcpserverSearchResultsReceived on successful search', (done) => {
      effects.performSearch(mockCriteria).subscribe((action) => {
        expect(action.type).toEqual(MCPServerSearchActions.mcpserverSearchResultsReceived.type)
        expect(action).toEqual(
          MCPServerSearchActions.mcpserverSearchResultsReceived({
            stream: [{ id: '1', name: 'Test MCP Server' }],
            size: 10,
            number: 0,
            totalElements: 1,
            totalPages: 1
          })
        )
        done()
      })
    })

    it('should dispatch mcpserverSearchResultsLoadingFailed on search error', (done) => {
      const mockError = 'Search failed'

      mcpService.findToolByCriteria.mockReturnValue(throwError(() => mockError))

      effects.performSearch(mockCriteria).subscribe((action) => {
        expect(action.type).toEqual(MCPServerSearchActions.mcpserverSearchResultsLoadingFailed.type)
        expect(action).toEqual(
          MCPServerSearchActions.mcpserverSearchResultsLoadingFailed({
            error: mockError
          })
        )
        done()
      })
    })

    it('should default missing response fields to empty results and zero counts', (done) => {
      mcpService.findToolByCriteria.mockReturnValue(of({} as unknown as HttpEvent<ToolPageResult>))

      effects
        .performSearch(mockCriteria)
        .pipe(take(1))
        .subscribe((action) => {
          expect(action).toEqual(
            MCPServerSearchActions.mcpserverSearchResultsReceived({
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

    it('should handle Date objects in search criteria', (done) => {
      const criteriaWithDate = {
        ...mockCriteria,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31')
      }

      const searchSpy = jest.spyOn(mcpService, 'findToolByCriteria')

      effects.performSearch(criteriaWithDate).subscribe(() => {
        expect(searchSpy).toHaveBeenCalledWith({
          type: ToolType.Mcp,
          ...mockCriteria,
          startDate: '2023-01-01T00:00:00.000Z',
          endDate: '2023-12-31T00:00:00.000Z'
        })
        done()
      })
    })
  })

  describe('exportData$', () => {
    it('should handle export with empty displayed columns', (done) => {
      const mockViewModel = {
        columns: [],
        searchCriteria: {},
        results: [{ id: '1', name: 'Server 1', description: 'Description 1', imagePath: '' }],
        displayedColumns: [],
        resultComponentState: { displayedColumns: undefined },
        searchHeaderComponentState: null,
        diagramComponentState: null,
        chartVisible: false,
        searchLoadingIndicator: false,
        searchExecuted: true
      } as unknown as MCPServerSearchViewModel

      store.overrideSelector(selectMCPServerSearchViewModel, mockViewModel)
      store.refreshState()

      effects.exportData$.subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalled()
        done()
      })

      actions$.next(MCPServerSearchActions.exportButtonClicked())
    })

    it('should handle export with null resultComponentState', (done) => {
      const mockViewModel = {
        columns: [],
        searchCriteria: {},
        results: [{ id: '1', name: 'Server 1', description: 'Description 1', imagePath: '' }],
        displayedColumns: [],
        resultComponentState: null,
        searchHeaderComponentState: null,
        diagramComponentState: null,
        chartVisible: false,
        searchLoadingIndicator: false,
        searchExecuted: true
      } as unknown as MCPServerSearchViewModel

      store.overrideSelector(selectMCPServerSearchViewModel, mockViewModel)
      store.refreshState()

      effects.exportData$.subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalled()
        done()
      })

      actions$.next(MCPServerSearchActions.exportButtonClicked())
    })

    it('should export CSV with correct parameters when export button is clicked', (done) => {
      const mockColumns = [
        { field: 'name', header: 'Name' },
        { field: 'description', header: 'Description' }
      ]
      const mockResults = [
        { id: '1', name: 'Server 1', description: 'Description 1' },
        { id: '2', name: 'Server 2', description: 'Description 2' }
      ]
      const mockViewModel = {
        resultComponentState: {
          displayedColumns: mockColumns
        },
        results: mockResults
      } as unknown as MCPServerSearchViewModel

      store.overrideSelector(selectMCPServerSearchViewModel, mockViewModel)
      store.refreshState()

      effects.exportData$.subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(mockColumns, mockResults, 'MCPServer.csv')
        done()
      })

      actions$.next(MCPServerSearchActions.exportButtonClicked())
    })

    it('should handle export with empty results', (done) => {
      const mockColumns = [
        { field: 'name', header: 'Name' },
        { field: 'description', header: 'Description' }
      ]
      const mockViewModel = {
        resultComponentState: {
          displayedColumns: mockColumns
        },
        results: []
      } as unknown as MCPServerSearchViewModel

      store.overrideSelector(selectMCPServerSearchViewModel, mockViewModel)
      store.refreshState()

      effects.exportData$.subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(mockColumns, [], 'MCPServer.csv')
        done()
      })

      actions$.next(MCPServerSearchActions.exportButtonClicked())
    })
  })

  describe('displayError$', () => {
    it('should display error message when mcpserverSearchResultsLoadingFailed action is dispatched', (done) => {
      const errorSpy = jest.spyOn(messageService, 'error')
      effects.displayError$.subscribe(() => {
        expect(errorSpy).toHaveBeenCalledWith({
          summaryKey: 'MCPSERVER_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
        })
        done()
      })

      actions$.next(MCPServerSearchActions.mcpserverSearchResultsLoadingFailed({ error: 'Test error' }))
    })

    it('should not display error message for actions not in errorMessages array', (done) => {
      const errorSpy = jest.spyOn(messageService, 'error')
      setTimeout(() => {
        expect(errorSpy).not.toHaveBeenCalled()
        done()
      }, 0)

      actions$.next(MCPServerSearchActions.resetButtonClicked())
    })
  })

  describe('refreshSearchAfterCreateUpdate$', () => {
    beforeEach(() => {
      store.overrideSelector(mcpserverSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()
    })

    it('should call performSearch with current criteria when createMcpserverSucceeded is dispatched', (done) => {
      const markerAction = MCPServerSearchActions.mcpserverSearchResultsLoadingFailed({ error: null })
      const performSearchSpy = jest.spyOn(effects, 'performSearch').mockReturnValue(of(markerAction))

      effects.refreshSearchAfterCreateUpdate$.pipe(take(1)).subscribe((action) => {
        expect(performSearchSpy).toHaveBeenCalledWith(mockCriteria)
        expect(action).toBe(markerAction)
        done()
      })

      actions$.next(MCPServerSearchActions.createMcpserverSucceeded())
    })

    it('should call performSearch with current criteria when updateMcpserverSucceeded is dispatched', (done) => {
      const markerAction = MCPServerSearchActions.mcpserverSearchResultsLoadingFailed({ error: null })
      const performSearchSpy = jest.spyOn(effects, 'performSearch').mockReturnValue(of(markerAction))

      effects.refreshSearchAfterCreateUpdate$.pipe(take(1)).subscribe((action) => {
        expect(performSearchSpy).toHaveBeenCalledWith(mockCriteria)
        expect(action).toBe(markerAction)
        done()
      })

      actions$.next(MCPServerSearchActions.updateMcpserverSucceeded())
    })
  })

  describe('createButtonClicked$', () => {
    it('should open the create dialog with the expected configuration', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe(() => {
        expect(portalDialogService.openDialog).toHaveBeenCalledWith(
          'MCPSERVER_CREATE_UPDATE.CREATE.HEADER',
          {
            type: McpserverCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: {}
              }
            }
          },
          'MCPSERVER_CREATE_UPDATE.CREATE.FORM.SAVE',
          'MCPSERVER_CREATE_UPDATE.CREATE.FORM.CANCEL',
          { baseZIndex: 100 }
        )
        done()
      })

      actions$.next(MCPServerSearchActions.createMcpserverButtonClicked())
    })

    it('should dispatch createMcpserverCancelled when the dialog is cancelled', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: { name: 'x' } }) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(MCPServerSearchActions.createMcpserverCancelled())
        expect(mcpService.createTool).not.toHaveBeenCalled()
        done()
      })

      actions$.next(MCPServerSearchActions.createMcpserverButtonClicked())
    })

    it('should dispatch createMcpserverCancelled when the dialog is dismissed without a result', (done) => {
      portalDialogService.openDialog.mockReturnValue(of(undefined) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(MCPServerSearchActions.createMcpserverCancelled())
        done()
      })

      actions$.next(MCPServerSearchActions.createMcpserverButtonClicked())
    })

    it('should dispatch createMcpserverFailed when the dialog confirms but returns no result', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as never)

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toEqual(MCPServerSearchActions.createMcpserverFailed.type)
        expect(mcpService.createTool).not.toHaveBeenCalled()
        done()
      })

      actions$.next(MCPServerSearchActions.createMcpserverButtonClicked())
    })

    it('should create the MCP server and dispatch createMcpserverSucceeded on success', (done) => {
      const successSpy = jest.spyOn(messageService, 'success')
      portalDialogService.openDialog.mockReturnValue(
        of({ button: 'primary', result: { name: 'New Server', description: 'desc' } }) as never
      )
      mcpService.createTool.mockReturnValue(of({} as unknown as HttpEvent<Tool>))

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(mcpService.createTool).toHaveBeenCalledWith({
          name: 'New Server',
          description: 'desc',
          type: ToolType.Mcp
        })
        expect(successSpy).toHaveBeenCalledWith({
          summaryKey: 'MCPSERVER_CREATE_UPDATE.CREATE.SUCCESS'
        })
        expect(action).toEqual(MCPServerSearchActions.createMcpserverSucceeded())
        done()
      })

      actions$.next(MCPServerSearchActions.createMcpserverButtonClicked())
    })

    it('should dispatch createMcpserverFailed and show an error message when the create call fails', (done) => {
      const errorSpy = jest.spyOn(messageService, 'error')
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: { name: 'New Server' } }) as never)
      mcpService.createTool.mockReturnValue(throwError(() => 'API Error'))

      effects.createButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(MCPServerSearchActions.createMcpserverFailed({ error: 'API Error' }))
        expect(errorSpy).toHaveBeenCalledWith({
          summaryKey: 'MCPSERVER_CREATE_UPDATE.CREATE.ERROR'
        })
        done()
      })

      actions$.next(MCPServerSearchActions.createMcpserverButtonClicked())
    })
  })

  describe('editButtonClicked$', () => {
    const item = { id: 'server-1', name: 'Server 1', modificationCount: 3 }

    beforeEach(() => {
      store.overrideSelector(mcpserverSearchSelectors.selectResults, [item])
      store.refreshState()
    })

    it('should open the update dialog with the item found in the results', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: undefined }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe(() => {
        expect(portalDialogService.openDialog).toHaveBeenCalledWith(
          'MCPSERVER_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: McpserverCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: item
              }
            }
          },
          'MCPSERVER_CREATE_UPDATE.UPDATE.FORM.SAVE',
          'MCPSERVER_CREATE_UPDATE.UPDATE.FORM.CANCEL',
          { baseZIndex: 100 }
        )
        done()
      })

      actions$.next(MCPServerSearchActions.editMcpserverButtonClicked({ id: 'server-1' }))
    })

    it('should dispatch updateMcpserverCancelled when the dialog is cancelled', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: null }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(MCPServerSearchActions.updateMcpserverCancelled())
        expect(mcpService.updateToolById).not.toHaveBeenCalled()
        done()
      })

      actions$.next(MCPServerSearchActions.editMcpserverButtonClicked({ id: 'server-1' }))
    })

    it('should dispatch updateMcpserverFailed when the dialog confirms but returns no result', (done) => {
      portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: undefined }) as never)

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toEqual(MCPServerSearchActions.updateMcpserverFailed.type)
        expect(mcpService.updateToolById).not.toHaveBeenCalled()
        done()
      })

      actions$.next(MCPServerSearchActions.editMcpserverButtonClicked({ id: 'server-1' }))
    })

    it('should dispatch updateMcpserverFailed when the dialog confirms without an id', (done) => {
      portalDialogService.openDialog.mockReturnValue(
        of({ button: 'primary', result: { name: 'Updated', modificationCount: 1 } }) as never
      )

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action.type).toEqual(MCPServerSearchActions.updateMcpserverFailed.type)
        expect(mcpService.updateToolById).not.toHaveBeenCalled()
        done()
      })

      actions$.next(MCPServerSearchActions.editMcpserverButtonClicked({ id: 'server-1' }))
    })

    it('should update the MCP server and dispatch updateMcpserverSucceeded on success', (done) => {
      const successSpy = jest.spyOn(messageService, 'success')
      portalDialogService.openDialog.mockReturnValue(
        of({
          button: 'primary',
          result: { id: 'server-1', name: 'Updated', description: 'desc', modificationCount: 3 }
        }) as never
      )
      mcpService.updateToolById.mockReturnValue(of({} as unknown as HttpEvent<Tool>))

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(mcpService.updateToolById).toHaveBeenCalledWith('server-1', {
          modificationCount: 3,
          name: 'Updated',
          description: 'desc'
        })
        expect(successSpy).toHaveBeenCalledWith({
          summaryKey: 'MCPSERVER_CREATE_UPDATE.UPDATE.SUCCESS'
        })
        expect(action).toEqual(MCPServerSearchActions.updateMcpserverSucceeded())
        done()
      })

      actions$.next(MCPServerSearchActions.editMcpserverButtonClicked({ id: 'server-1' }))
    })

    it('should default missing modificationCount to 0 when updating', (done) => {
      portalDialogService.openDialog.mockReturnValue(
        of({
          button: 'primary',
          result: { id: 'server-1', name: 'Updated', description: 'desc' }
        }) as never
      )
      mcpService.updateToolById.mockReturnValue(of({} as unknown as HttpEvent<Tool>))

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(mcpService.updateToolById).toHaveBeenCalledWith('server-1', {
          modificationCount: 0,
          name: 'Updated',
          description: 'desc'
        })
        expect(action).toEqual(MCPServerSearchActions.updateMcpserverSucceeded())
        done()
      })

      actions$.next(MCPServerSearchActions.editMcpserverButtonClicked({ id: 'server-1' }))
    })

    it('should dispatch updateMcpserverFailed and show an error message when the update call fails', (done) => {
      const errorSpy = jest.spyOn(messageService, 'error')
      portalDialogService.openDialog.mockReturnValue(
        of({
          button: 'primary',
          result: { id: 'server-1', name: 'Updated', modificationCount: 3 }
        }) as never
      )
      mcpService.updateToolById.mockReturnValue(throwError(() => 'Update failed'))

      effects.editButtonClicked$.pipe(take(1)).subscribe((action) => {
        expect(action).toEqual(MCPServerSearchActions.updateMcpserverFailed({ error: 'Update failed' }))
        expect(errorSpy).toHaveBeenCalledWith({
          summaryKey: 'MCPSERVER_CREATE_UPDATE.UPDATE.ERROR'
        })
        done()
      })

      actions$.next(MCPServerSearchActions.editMcpserverButtonClicked({ id: 'server-1' }))
    })
  })
})

import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, ActivatedRouteSnapshot, EventType, Router } from '@angular/router'
import { provideMockActions } from '@ngrx/effects/testing'
import { routerNavigatedAction } from '@ngrx/router-store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { PortalMessageServiceMock, providePortalMessageServiceMock } from '@onecx/angular-integration-interface/mocks'
import { DialogState, PortalDialogService } from '@onecx/portal-integration-angular'
import { MonoTypeOperatorFunction, ReplaySubject, map, of, throwError } from 'rxjs'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'
import { selectRouteParams, selectUrl } from 'src/app/shared/selectors/router.selectors'
import { MCPServer, McpServerService } from '../../../shared/generated'
import { MCPServerDetailsActions } from './mcpserver-details.actions'
import { MCPServerDetailsComponent } from './mcpserver-details.component'
import { MCPServerDetailsEffects } from './mcpserver-details.effects'
import { mcpserverDetailsSelectors } from './mcpserver-details.selectors'

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


describe('MCPServerDetailsEffects', () => {
    let actions$: ReplaySubject<any>
    let effects: MCPServerDetailsEffects
    let store: MockStore
    let mcpService: jest.Mocked<McpServerService>
    let router: jest.Mocked<Router>
    let portalDialogService: jest.Mocked<PortalDialogService>

    let mockMessageService: PortalMessageServiceMock

    const mockId = 'test-id'
    const mockActivatedRoute = {
        snapshot: {
            data: {}
        }
    }

    beforeEach(async () => {
        actions$ = new ReplaySubject(1)

        mcpService = {
            getMCPServerById: jest.fn(),
            updateMCPServerById: jest.fn(),
            deleteMCPServerById: jest.fn()
        } as unknown as jest.Mocked<McpServerService>

        router = {
            navigate: jest.fn().mockResolvedValue(true),
            parseUrl: jest.fn().mockImplementation((url: string) => {
                const urlParts = url.split('?')[0]
                return {
                    queryParams: {},
                    fragment: null,
                    toString: () => urlParts
                }
            }),
            createUrlTree: jest.fn().mockImplementation((commands: any[]) => ({
                toString: () => commands.join('/')
            })),
            isActive: jest.fn(),
            serializeUrl: jest.fn().mockImplementation((urlTree: any) => urlTree.toString()),
            routerState: {
                root: {
                    component: MCPServerDetailsComponent,
                    firstChild: {
                        component: MCPServerDetailsComponent,
                        paramMap: new Map([['id', mockId]]),
                        url: '',
                        urlSegments: [],
                        outlet: 'primary',
                        params: {},
                        queryParams: {},
                        fragment: null,
                        data: {},
                        children: []
                    }
                },
                snapshot: {
                    url: '',
                    root: {
                        component: MCPServerDetailsComponent,
                        firstChild: {
                            component: MCPServerDetailsComponent,
                            paramMap: new Map([['id', mockId]]),
                            url: '',
                            urlSegments: [],
                            outlet: 'primary',
                            params: {},
                            queryParams: {},
                            fragment: null,
                            data: {},
                            children: []
                        }
                    }
                }
            }
        } as unknown as jest.Mocked<Router>

        portalDialogService = {
            openDialog: jest.fn()
        } as unknown as jest.Mocked<PortalDialogService>

        await TestBed.configureTestingModule({
            providers: [
                MCPServerDetailsEffects,
                provideMockActions(() => actions$),
                provideMockStore({ initialState: {} }),
                { provide: McpServerService, useValue: mcpService },
                { provide: Router, useValue: router },
                { provide: PortalDialogService, useValue: portalDialogService },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                providePortalMessageServiceMock()
            ]
        }).compileComponents()

        mockMessageService = TestBed.inject(PortalMessageServiceMock)

        // Instead of letting Angular DI try to resolve the @SkipSelf() ActivatedRoute (which has no parent injector in TestBed),
        // construct the effect instance manually and pass the desired route object as the "parent".
        const { Actions } = await import('@ngrx/effects')
        const ngrxActions = new Actions(actions$)
        effects = new MCPServerDetailsEffects(
            ngrxActions,
            mcpService,
            router,
            TestBed.inject(MockStore),
            mockMessageService as any,
            portalDialogService
        )
        store = TestBed.inject(MockStore)
    })

    describe('navigatedToDetailsPage$', () => {
        it('should dispatch navigatedToDetailsPage with route param id', (done) => {
            const mockId = 'abc'
            const mockAction = routerNavigatedAction({
                payload: {
                    event: {
                        urlAfterRedirects: '',
                        type: EventType.NavigationEnd,
                        id: 0,
                        url: ''
                    },
                    routerState: {
                        root: new ActivatedRouteSnapshot(),
                        url: ''
                    }
                }
            })

            // override the whole route params so the selector factory inside the effect resolves correctly
            store.overrideSelector(selectRouteParams, { id: mockId } as any)
            store.refreshState()

            actions$.next(mockAction)

            effects.navigatedToDetailsPage$.subscribe((action) => {
                expect(action).toEqual(MCPServerDetailsActions.navigatedToDetailsPage({ id: mockId }))
                done()
            })
        })
    })

    describe('loadMCPServerById$', () => {
        it('should dispatch mCPServerDetailsReceived on success', (done) => {
            const resource = { id: '1', apiKey: 'k' } as MCPServer
            mcpService.getMCPServerById.mockReturnValue(of({ ...resource }) as any)

            actions$.next(MCPServerDetailsActions.navigatedToDetailsPage({ id: '1' }))

            effects.loadMCPServerById$.subscribe((action) => {
                expect(action).toEqual(MCPServerDetailsActions.mCPServerDetailsReceived({ details: resource }))
                done()
            })
        })

        it('should dispatch mCPServerDetailsLoadingFailed on error', (done) => {
            const err = 'failed'
            mcpService.getMCPServerById.mockReturnValue(throwError(() => err) as any)

            actions$.next(MCPServerDetailsActions.navigatedToDetailsPage({ id: '1' }))

            effects.loadMCPServerById$.subscribe((action) => {
                expect(action.type).toEqual(MCPServerDetailsActions.mCPServerDetailsLoadingFailed.type)
                expect(action).toEqual(MCPServerDetailsActions.mCPServerDetailsLoadingFailed({ error: err }))
                done()
            })
        })
    })

    describe('cancelButtonClickedDirty$', () => {
        it('should cancel and dispatch cancelEditBackClicked when dialog is cancelled', (done) => {
            const dialogResult = { button: 'secondary' } as DialogState<MCPServer>
            portalDialogService.openDialog.mockReturnValue(of(dialogResult) as any)

            actions$.next(MCPServerDetailsActions.cancelButtonClicked({ dirty: true }))

            effects.cancelButtonClickedDirty$.subscribe((action) => {
                expect(action).toEqual(MCPServerDetailsActions.cancelEditBackClicked())
                done()
            })
        })

        it('should confirm and dispatch cancelEditConfirmClicked when dialog confirmed', (done) => {
            const dialogResult = { button: 'primary', result: {} } as DialogState<MCPServer>
            portalDialogService.openDialog.mockReturnValue(of(dialogResult) as any)

            actions$.next(MCPServerDetailsActions.cancelButtonClicked({ dirty: true }))

            effects.cancelButtonClickedDirty$.subscribe((action) => {
                expect(action).toEqual(MCPServerDetailsActions.cancelEditConfirmClicked())
                done()
            })
        })
    })

    describe('saveButtonClicked$', () => {
        it('should cancel update when details missing id', (done) => {
            store.overrideSelector(mcpserverDetailsSelectors.selectDetails, { id: undefined } as any)
            store.refreshState()

            actions$.next(MCPServerDetailsActions.saveButtonClicked({ details: {} as any }))

            effects.saveButtonClicked$.subscribe((action) => {
                expect(action).toEqual(MCPServerDetailsActions.updateMCPServerCancelled())
                done()
            })
        })

        it('should call update and dispatch success on success', (done) => {
            const successSpy = jest.spyOn(mockMessageService, 'success')
            const details = { id: '1', apiKey: 'old' } as MCPServer
            store.overrideSelector(mcpserverDetailsSelectors.selectDetails, details)
            store.refreshState()

            mcpService.updateMCPServerById.mockReturnValue(of({}) as any)

            const newDetails = { apiKey: 'new' }
            actions$.next(MCPServerDetailsActions.saveButtonClicked({ details: newDetails as any }))

            effects.saveButtonClicked$.subscribe((action) => {
                expect(mcpService.updateMCPServerById).toHaveBeenCalledWith('1', { ...details, ...newDetails })
                expect(successSpy).toHaveBeenCalledWith({ summaryKey: 'MCPSERVER_DETAILS.UPDATE.SUCCESS' })
                expect(action).toEqual(MCPServerDetailsActions.updateMCPServerSucceeded())
                done()
            })
        })

        it('should dispatch failed and show error on update failure', (done) => {
            const errorSpy = jest.spyOn(mockMessageService, 'error')
            const details = { id: '1', apiKey: 'old' } as MCPServer
            store.overrideSelector(mcpserverDetailsSelectors.selectDetails, details)
            store.refreshState()

            const err = 'update failed'
            mcpService.updateMCPServerById.mockReturnValue(throwError(() => err) as any)

            actions$.next(MCPServerDetailsActions.saveButtonClicked({ details: { apiKey: 'new' } as any }))

            effects.saveButtonClicked$.subscribe((action) => {
                expect(action.type).toEqual(MCPServerDetailsActions.updateMCPServerFailed.type)
                expect(errorSpy).toHaveBeenCalledWith({ summaryKey: 'MCPSERVER_DETAILS.UPDATE.ERROR' })
                done()
            })
        })
    })

    describe('deleteButtonClicked$', () => {
        it('should cancel deletion when dialog cancelled', (done) => {
            portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary' } as DialogState<any>) as any)
            store.overrideSelector(mcpserverDetailsSelectors.selectDetails, { id: '1' } as any)
            store.refreshState()

            actions$.next(MCPServerDetailsActions.deleteButtonClicked())

            effects.deleteButtonClicked$.subscribe((action) => {
                expect(action).toEqual(MCPServerDetailsActions.deleteMCPServerCancelled())
                done()
            })
        })

        it('should delete and dispatch success on API success', (done) => {
            const successSpy = jest.spyOn(mockMessageService, 'success')
            portalDialogService.openDialog.mockReturnValue(of({ button: 'primary' } as DialogState<any>) as any)
            store.overrideSelector(mcpserverDetailsSelectors.selectDetails, { id: '2' } as any)
            store.refreshState()

            mcpService.deleteMCPServerById.mockReturnValue(of({}) as any)

            actions$.next(MCPServerDetailsActions.deleteButtonClicked())

            effects.deleteButtonClicked$.subscribe((action) => {
                expect(mcpService.deleteMCPServerById).toHaveBeenCalledWith('2')
                expect(successSpy).toHaveBeenCalledWith({ summaryKey: 'MCPSERVER_DETAILS.DELETE.SUCCESS' })
                expect(action).toEqual(MCPServerDetailsActions.deleteMCPServerSucceeded())
                done()
            })
        })

        it('should dispatch failed and show error when delete API fails', (done) => {
            const errorSpy = jest.spyOn(mockMessageService, 'error')
            portalDialogService.openDialog.mockReturnValue(of({ button: 'primary' } as DialogState<any>) as any)
            store.overrideSelector(mcpserverDetailsSelectors.selectDetails, { id: '2' } as any)
            store.refreshState()

            const err = 'delete failed'
            mcpService.deleteMCPServerById.mockReturnValue(throwError(() => err) as any)

            actions$.next(MCPServerDetailsActions.deleteButtonClicked())

            effects.deleteButtonClicked$.subscribe((action) => {
                expect(action.type).toEqual(MCPServerDetailsActions.deleteMCPServerFailed.type)
                expect(errorSpy).toHaveBeenCalledWith({ summaryKey: 'MCPSERVER_DETAILS.DELETE.ERROR' })
                done()
            })
        })
    })

    describe('deleteMCPServerSucceeded$', () => {
        it('should navigate to parent URL without query/fragment', (done) => {
            store.overrideSelector(selectUrl, '/some/path/details/1?x=1#frag')
            store.refreshState()

            actions$.next(MCPServerDetailsActions.deleteMCPServerSucceeded())

            effects.deleteMCPServerSucceeded$.subscribe(() => {
                expect(router.parseUrl).toHaveBeenCalledWith('/some/path/details/1?x=1#frag')
                expect(router.navigate).toHaveBeenCalledWith(['/some/path'])
                done()
            })
        })
    })

    describe('displayError$', () => {
        it('should display error message on mCPServerDetailsLoadingFailed', (done) => {
            const errorSpy = jest.spyOn(mockMessageService, 'error')
            actions$.next(MCPServerDetailsActions.mCPServerDetailsLoadingFailed({ error: 'err' }))

            effects.displayError$.subscribe(() => {
                expect(errorSpy).toHaveBeenCalledWith({ summaryKey: 'MCPSERVER_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED' })
                done()
            })
        })

        it('should not display on unrelated action', (done) => {
            const errorSpy = jest.spyOn(mockMessageService, 'error')

            setTimeout(() => {
                expect(errorSpy).not.toHaveBeenCalled()
                done()
            }, 0)

            actions$.next(MCPServerDetailsActions.cancelEditBackClicked())
        })
    })

    describe('navigateBack$', () => {
        it('should go back and dispatch backNavigationStarted when possible', (done) => {
            store.overrideSelector(selectBackNavigationPossible, true)
            store.refreshState()

            const spy = jest.spyOn(window.history, 'back')

            actions$.next(MCPServerDetailsActions.navigateBackButtonClicked())

            effects.navigateBack$.subscribe((action) => {
                expect(spy).toHaveBeenCalled()
                expect(action).toEqual(MCPServerDetailsActions.backNavigationStarted())
                done()
            })
        })

        it('should dispatch backNavigationFailed when not possible', (done) => {
            store.overrideSelector(selectBackNavigationPossible, false)
            store.refreshState()

            actions$.next(MCPServerDetailsActions.navigateBackButtonClicked())

            effects.navigateBack$.subscribe((action) => {
                expect(action).toEqual(MCPServerDetailsActions.backNavigationFailed())
                done()
            })
        })
    })
})

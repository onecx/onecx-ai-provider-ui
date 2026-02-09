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
import { Configuration, ConfigurationService, McpServerService, ProviderService } from '../../../shared/generated'
import { ConfigurationDetailsActions } from './configuration-details.actions'
import { ConfigurationDetailsComponent } from './configuration-details.component'
import { ConfigurationDetailsEffects } from './configuration-details.effects'
import { configurationDetailsSelectors } from './configuration-details.selectors'

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


describe('ConfigurationDetailsEffects', () => {
    let actions$: ReplaySubject<any>
    let effects: ConfigurationDetailsEffects
    let store: MockStore
    let configurationService: jest.Mocked<ConfigurationService>
    let providerService: jest.Mocked<ProviderService>
    let mcpServerService: jest.Mocked<McpServerService>
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

        configurationService = {
            getConfiguration: jest.fn(),
            updateConfiguration: jest.fn(),
            deleteConfiguration: jest.fn()
        } as unknown as jest.Mocked<ConfigurationService>

        providerService = {
            findProviderBySearchCriteria: jest.fn()
        } as unknown as jest.Mocked<ProviderService>

        mcpServerService = {
            findMCPServerByCriteria: jest.fn()
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
                    component: ConfigurationDetailsComponent,
                    firstChild: {
                        component: ConfigurationDetailsComponent,
                        paramMap: new Map([["id", mockId]]),
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
                        component: ConfigurationDetailsComponent,
                        firstChild: {
                            component: ConfigurationDetailsComponent,
                            paramMap: new Map([["id", mockId]]),
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
                ConfigurationDetailsEffects,
                provideMockActions(() => actions$),
                provideMockStore({ initialState: {} }),
                { provide: ConfigurationService, useValue: configurationService },
                { provide: ProviderService, useValue: providerService },
                { provide: McpServerService, useValue: mcpServerService },
                { provide: Router, useValue: router },
                { provide: PortalDialogService, useValue: portalDialogService },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                providePortalMessageServiceMock()
            ]
        }).compileComponents()

        mockMessageService = TestBed.inject(PortalMessageServiceMock)

        const { Actions } = await import('@ngrx/effects')
        const ngrxActions = new Actions(actions$)
        effects = new ConfigurationDetailsEffects(
            ngrxActions,
            configurationService,
            providerService,
            mcpServerService,
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
            store.overrideSelector(selectRouteParams, { id: mockId } as any)
            store.refreshState()
            actions$.next(mockAction)
            effects.navigatedToDetailsPage$.subscribe((action) => {
                expect(action).toEqual(ConfigurationDetailsActions.navigatedToDetailsPage({ id: mockId }))
                done()
            })
        })
    })

    describe('loadConfigurationById$', () => {
        it('should dispatch configurationDetailsReceived on success', (done) => {
            const resource = { id: '1', name: 'c' } as Configuration
            configurationService.getConfiguration.mockReturnValue(of({ ...resource }) as any)
            actions$.next(ConfigurationDetailsActions.navigatedToDetailsPage({ id: '1' }))
            effects.loadConfigurationById$.subscribe((action) => {
                expect(action).toEqual(ConfigurationDetailsActions.configurationDetailsReceived({ details: resource }))
                done()
            })
        })
        it('should dispatch configurationDetailsLoadingFailed on error', (done) => {
            const err = 'failed'
            configurationService.getConfiguration.mockReturnValue(throwError(() => err) as any)
            actions$.next(ConfigurationDetailsActions.navigatedToDetailsPage({ id: '1' }))
            effects.loadConfigurationById$.subscribe((action) => {
                expect(action.type).toEqual(ConfigurationDetailsActions.configurationDetailsLoadingFailed.type)
                expect(action).toEqual(ConfigurationDetailsActions.configurationDetailsLoadingFailed({ error: err }))
                done()
            })
        })
    })

    describe('cancelButtonClickedDirty$', () => {
        it('should cancel and dispatch cancelEditBackClicked when dialog is cancelled', (done) => {
            const dialogResult = { button: 'secondary' } as DialogState<Configuration>
            portalDialogService.openDialog.mockReturnValue(of(dialogResult) as any)
            actions$.next(ConfigurationDetailsActions.cancelButtonClicked({ dirty: true }))
            effects.cancelButtonClickedDirty$.subscribe((action) => {
                expect(action).toEqual(ConfigurationDetailsActions.cancelEditBackClicked())
                done()
            })
        })
        it('should confirm and dispatch cancelEditConfirmClicked when dialog confirmed', (done) => {
            const dialogResult = { button: 'primary', result: {} } as DialogState<Configuration>
            portalDialogService.openDialog.mockReturnValue(of(dialogResult) as any)
            actions$.next(ConfigurationDetailsActions.cancelButtonClicked({ dirty: true }))
            effects.cancelButtonClickedDirty$.subscribe((action) => {
                expect(action).toEqual(ConfigurationDetailsActions.cancelEditConfirmClicked())
                done()
            })
        })
    })

    describe('saveButtonClicked$', () => {
        it('should cancel update when details missing id', (done) => {
            store.overrideSelector(configurationDetailsSelectors.selectDetails, { id: undefined } as any)
            store.refreshState()
            actions$.next(ConfigurationDetailsActions.saveButtonClicked({ details: {} as any }))
            effects.saveButtonClicked$.subscribe((action) => {
                expect(action).toEqual(ConfigurationDetailsActions.updateConfigurationCancelled())
                done()
            })
        })
        it('should call update and dispatch success on success', (done) => {
            const successSpy = jest.spyOn(mockMessageService, 'success')
            const details = { id: '1', name: 'old' } as Configuration
            store.overrideSelector(configurationDetailsSelectors.selectDetails, details)
            store.refreshState()
            configurationService.updateConfiguration.mockReturnValue(of({}) as any)
            const newDetails = { name: 'new' }
            actions$.next(ConfigurationDetailsActions.saveButtonClicked({ details: newDetails as any }))
            effects.saveButtonClicked$.subscribe((action) => {
                expect(configurationService.updateConfiguration).toHaveBeenCalledWith('1', { ...details, ...newDetails })
                expect(successSpy).toHaveBeenCalledWith({ summaryKey: 'CONFIGURATION_DETAILS.UPDATE.SUCCESS' })
                expect(action).toEqual(ConfigurationDetailsActions.updateConfigurationSucceeded())
                done()
            })
        })
        it('should dispatch failed and show error on update failure', (done) => {
            const errorSpy = jest.spyOn(mockMessageService, 'error')
            const details = { id: '1', name: 'old' } as Configuration
            store.overrideSelector(configurationDetailsSelectors.selectDetails, details)
            store.refreshState()
            const err = 'update failed'
            configurationService.updateConfiguration.mockReturnValue(throwError(() => err) as any)
            actions$.next(ConfigurationDetailsActions.saveButtonClicked({ details: { name: 'new' } as any }))
            effects.saveButtonClicked$.subscribe((action) => {
                expect(action.type).toEqual(ConfigurationDetailsActions.updateConfigurationFailed.type)
                expect(errorSpy).toHaveBeenCalledWith({ summaryKey: 'CONFIGURATION_DETAILS.UPDATE.ERROR' })
                done()
            })
        })
    })

    describe('deleteButtonClicked$', () => {
        it('should cancel deletion when dialog cancelled', (done) => {
            portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary' } as DialogState<any>) as any)
            store.overrideSelector(configurationDetailsSelectors.selectDetails, { id: '1' } as any)
            store.refreshState()
            actions$.next(ConfigurationDetailsActions.deleteButtonClicked())
            effects.deleteButtonClicked$.subscribe((action) => {
                expect(action).toEqual(ConfigurationDetailsActions.deleteConfigurationCancelled())
                done()
            })
        })
        it('should delete and dispatch success on API success', (done) => {
            const successSpy = jest.spyOn(mockMessageService, 'success')
            portalDialogService.openDialog.mockReturnValue(of({ button: 'primary' } as DialogState<any>) as any)
            store.overrideSelector(configurationDetailsSelectors.selectDetails, { id: '2' } as any)
            store.refreshState()
            configurationService.deleteConfiguration.mockReturnValue(of({}) as any)
            actions$.next(ConfigurationDetailsActions.deleteButtonClicked())
            effects.deleteButtonClicked$.subscribe((action) => {
                expect(configurationService.deleteConfiguration).toHaveBeenCalledWith('2')
                expect(successSpy).toHaveBeenCalledWith({ summaryKey: 'CONFIGURATION_DETAILS.DELETE.SUCCESS' })
                expect(action).toEqual(ConfigurationDetailsActions.deleteConfigurationSucceeded())
                done()
            })
        })
        it('should dispatch failed and show error when delete API fails', (done) => {
            const errorSpy = jest.spyOn(mockMessageService, 'error')
            portalDialogService.openDialog.mockReturnValue(of({ button: 'primary' } as DialogState<any>) as any)
            store.overrideSelector(configurationDetailsSelectors.selectDetails, { id: '2' } as any)
            store.refreshState()
            const err = 'delete failed'
            configurationService.deleteConfiguration.mockReturnValue(throwError(() => err) as any)
            actions$.next(ConfigurationDetailsActions.deleteButtonClicked())
            effects.deleteButtonClicked$.subscribe((action) => {
                expect(action.type).toEqual(ConfigurationDetailsActions.deleteConfigurationFailed.type)
                expect(errorSpy).toHaveBeenCalledWith({ summaryKey: 'CONFIGURATION_DETAILS.DELETE.ERROR' })
                done()
            })
        })
    })

    describe('deleteConfigurationSucceeded$', () => {
        it('should navigate to parent URL without query/fragment', (done) => {
            store.overrideSelector(selectUrl, '/some/path/details/1?x=1#frag')
            store.refreshState()
            actions$.next(ConfigurationDetailsActions.deleteConfigurationSucceeded())
            effects.deleteConfigurationSucceeded$.subscribe(() => {
                expect(router.parseUrl).toHaveBeenCalledWith('/some/path/details/1?x=1#frag')
                expect(router.navigate).toHaveBeenCalledWith(['/some/path'])
                done()
            })
        })
    })

    describe('displayError$', () => {
        it('should display error message on configurationDetailsLoadingFailed', (done) => {
            const errorSpy = jest.spyOn(mockMessageService, 'error')
            actions$.next(ConfigurationDetailsActions.configurationDetailsLoadingFailed({ error: 'err' }))
            effects.displayError$.subscribe(() => {
                expect(errorSpy).toHaveBeenCalledWith({ summaryKey: 'CONFIGURATION_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED' })
                done()
            })
        })
        it('should not display on unrelated action', (done) => {
            const errorSpy = jest.spyOn(mockMessageService, 'error')
            setTimeout(() => {
                expect(errorSpy).not.toHaveBeenCalled()
                done()
            }, 0)
            actions$.next(ConfigurationDetailsActions.cancelEditBackClicked())
        })
    })

    describe('navigateBack$', () => {
        it('should go back and dispatch backNavigationStarted when possible', (done) => {
            store.overrideSelector(selectBackNavigationPossible, true)
            store.refreshState()
            const spy = jest.spyOn(window.history, 'back')
            actions$.next(ConfigurationDetailsActions.navigateBackButtonClicked())
            effects.navigateBack$.subscribe((action) => {
                expect(spy).toHaveBeenCalled()
                expect(action).toEqual(ConfigurationDetailsActions.backNavigationStarted())
                done()
            })
        })
        it('should dispatch backNavigationFailed when not possible', (done) => {
            store.overrideSelector(selectBackNavigationPossible, false)
            store.refreshState()
            actions$.next(ConfigurationDetailsActions.navigateBackButtonClicked())
            effects.navigateBack$.subscribe((action) => {
                expect(action).toEqual(ConfigurationDetailsActions.backNavigationFailed())
                done()
            })
        })
    })
})

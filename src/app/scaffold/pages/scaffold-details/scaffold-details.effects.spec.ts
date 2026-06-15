import { TestBed } from '@angular/core/testing'
import { ScaffoldDetailsComponent } from './scaffold-details.component'
import { provideMockActions } from '@ngrx/effects/testing'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { providePortalMessageServiceMock } from '@onecx/angular-integration-interface/mocks'
import { PortalMessageService } from '@onecx/angular-integration-interface'
import { ReplaySubject, of, throwError } from 'rxjs'
import { Router } from '@angular/router'
import { ScaffoldService } from 'src/app/shared/generated'
import { selectRouteParam } from 'src/app/shared/selectors/router.selectors'
import { ScaffoldDetailsActions } from './scaffold-details.actions'
import { ScaffoldDetailsEffects } from './scaffold-details.effects'
import { scaffoldDetailsSelectors } from './scaffold-details.selectors'
import { routerNavigatedAction } from '@ngrx/router-store'

jest.mock('@onecx/ngrx-accelerator', () => {
  const actual = jest.requireActual('@onecx/ngrx-accelerator')

  return {
    ...actual,
    filterForNavigatedTo: () => (source$: any) => source$
  }
})

describe('ScaffoldDetailsEffects', () => {
  let actions$: ReplaySubject<unknown>
  let effects: ScaffoldDetailsEffects
  let scaffoldService: jest.Mocked<ScaffoldService>
  let router: jest.Mocked<Router>
  let store: MockStore

  beforeEach(async () => {
    actions$ = new ReplaySubject<unknown>(1)
    scaffoldService = {
      getScaffoldById: jest.fn(),
      updateScaffoldById: jest.fn(),
      deleteScaffoldById: jest.fn()
    } as unknown as jest.Mocked<ScaffoldService>

    router = {
      navigate: jest.fn(),
      routerState: {
        root: {
          component: ScaffoldDetailsComponent,
          children: []
        }
      }
    } as unknown as jest.Mocked<Router>

    await TestBed.configureTestingModule({
      providers: [
        ScaffoldDetailsEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [
            { selector: selectRouteParam('id'), value: '1' },
            {
              selector: scaffoldDetailsSelectors.selectDetails,
              value: { id: '1', name: 'Test', sourceProduct: 'Prod', systemPrompt: 'Prompt' } as any
            }
          ]
        }),
        { provide: Router, useValue: router },
        { provide: ScaffoldService, useValue: scaffoldService },
        providePortalMessageServiceMock()
      ]
    }).compileComponents()

    effects = TestBed.inject(ScaffoldDetailsEffects)
    store = TestBed.inject(MockStore)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should dispatch navigatedToDetailsPage when routerNavigatedAction occurs', (done) => {
    jest.spyOn(store, 'select').mockReturnValue(of('1'))

    effects.navigatedToDetailsPage$.subscribe((action) => {
        expect(action).toEqual(
        ScaffoldDetailsActions.navigatedToDetailsPage({ id: '1' })
        )
        done()
    })

    actions$.next(
        routerNavigatedAction({
        payload: {
            routerState: {
            root: {
                queryParams: {}
            }
            }
        }
        } as any)
    )
  })

  it('should update scaffold on successful editButtonClicked', (done) => {
    scaffoldService.updateScaffoldById.mockReturnValue(of({} as any))

    effects.editButtonClicked$.subscribe((action) => {
      expect(action).toEqual(ScaffoldDetailsActions.updateScaffoldSucceeded())
      done()
    })

    actions$.next(ScaffoldDetailsActions.editScaffoldButtonClicked({ id: '1' }))
  })

  it('should throw error on editButtonClicked when item not found', (done) => {
    effects.editButtonClicked$.subscribe(
      () => {},
      (error) => {
        expect(error.message).toBe('Item to update not found!')
        done()
      }
    )

    actions$.next(ScaffoldDetailsActions.editScaffoldButtonClicked({ id: '999' }))
  })

  it('should return scaffoldDetailsReceived on successful loadScaffoldById', (done) => {
    scaffoldService.getScaffoldById.mockReturnValue(of({ id: '1', name: 'Test' } as any))

    effects.loadScaffoldById$.subscribe((action) => {
      expect(action).toEqual(ScaffoldDetailsActions.scaffoldDetailsReceived({ details: { id: '1', name: 'Test' } as any }))
      done()
    })

    actions$.next(ScaffoldDetailsActions.navigatedToDetailsPage({ id: '1' }))
  })

  it('should return scaffoldDetailsLoadingFailed when loadScaffoldById fails', (done) => {
    scaffoldService.getScaffoldById.mockReturnValue(throwError(() => new Error('fail')) as any)

    effects.loadScaffoldById$.subscribe((action) => {
      expect(action.type).toEqual(ScaffoldDetailsActions.scaffoldDetailsLoadingFailed.type)
      expect((action as any).error).toBeInstanceOf(Error)
      done()
    })

    actions$.next(ScaffoldDetailsActions.navigatedToDetailsPage({ id: '1' }))
  })

  it('should call getScaffoldById with empty string when id is undefined', (done) => {
    scaffoldService.getScaffoldById.mockReturnValue(of({ id: 'fallback' } as any))

    effects.loadScaffoldById$.subscribe((action) => {
      expect(scaffoldService.getScaffoldById).toHaveBeenCalledWith('')
      expect(action).toEqual(
      ScaffoldDetailsActions.scaffoldDetailsReceived({
        details: { id: 'fallback' } as any
      })
      )
      done()
    })

    actions$.next(
        ScaffoldDetailsActions.navigatedToDetailsPage({ id: undefined })
    )
  })


  it('should update scaffold and return updateScaffoldSucceeded when editButtonClicked succeeds', (done) => {
    scaffoldService.updateScaffoldById.mockReturnValue(of({} as any))

    effects.editButtonClicked$.subscribe((action) => {
      expect(action).toEqual(ScaffoldDetailsActions.updateScaffoldSucceeded())
      done()
    })

    actions$.next(ScaffoldDetailsActions.editScaffoldButtonClicked({ id: '1' }))
  })

  it('should return updateScaffoldFailed when editButtonClicked fails', (done) => {
    scaffoldService.updateScaffoldById.mockReturnValue(throwError(() => new Error('fail')) as any)

    effects.editButtonClicked$.subscribe((action) => {
      expect(action.type).toEqual(ScaffoldDetailsActions.updateScaffoldFailed.type)
      expect((action as any).error).toBeInstanceOf(Error)
      done()
    })

    actions$.next(ScaffoldDetailsActions.editScaffoldButtonClicked({ id: '1' }))
  })

  it('should use empty string when result id is undefined and still call update', (done) => {
    scaffoldService.updateScaffoldById.mockReturnValue(of({} as any))

    const store = TestBed.inject(MockStore)

    const mockDetails = {
      id: undefined,
      name: 'Test',
      sourceProduct: 'Prod',
      systemPrompt: 'Prompt'
    }

    store.overrideSelector(scaffoldDetailsSelectors.selectDetails, mockDetails)
    store.refreshState()

    effects.editButtonClicked$.subscribe((action) => {
      expect(scaffoldService.updateScaffoldById).toHaveBeenCalledWith('', expect.any(Object))
      expect(action).toEqual(ScaffoldDetailsActions.updateScaffoldSucceeded())
      done()
    })

    actions$.next(
      ScaffoldDetailsActions.editScaffoldButtonClicked({
        id: mockDetails.id as any
      })
    )
  })

  it('should delete scaffold and return deleteScaffoldSucceeded when deleteButtonClicked succeeds', (done) => {
    scaffoldService.deleteScaffoldById.mockReturnValue(of({} as any))

    effects.deleteButtonClicked$.subscribe((action) => {
      expect(action).toEqual(ScaffoldDetailsActions.deleteScaffoldSucceeded())
      done()
    })

    actions$.next(ScaffoldDetailsActions.deleteButtonClicked())
  })

  it('should return deleteScaffoldFailed when deleteButtonClicked fails', (done) => {
    scaffoldService.deleteScaffoldById.mockReturnValue(throwError(() => new Error('fail')) as any)

    effects.deleteButtonClicked$.subscribe((action) => {
      expect(action.type).toEqual(ScaffoldDetailsActions.deleteScaffoldFailed.type)
      expect((action as any).error).toBeInstanceOf(Error)
      done()
    })

    actions$.next(ScaffoldDetailsActions.deleteButtonClicked())
  })

  it('should return deleteScaffoldFailed when details is undefined (covers optional chaining)', (done) => {
    const store = TestBed.inject(MockStore)

    store.overrideSelector(scaffoldDetailsSelectors.selectDetails, undefined)
    store.refreshState()

    effects.deleteButtonClicked$.subscribe((action) => {
      expect(action).toEqual(
        ScaffoldDetailsActions.deleteScaffoldFailed({
          error: 'Missing id'
        })
      )
      done()
    })

    actions$.next(ScaffoldDetailsActions.deleteButtonClicked())
  })

  it('should display error message on scaffoldDetailsLoadingFailed', () => {
    const messageService = TestBed.inject(PortalMessageService) as any
    const messageErrorSpy = jest.spyOn(messageService, 'error')
    expect(messageErrorSpy).not.toHaveBeenCalled()

    effects.displayError$.subscribe()
    actions$.next(ScaffoldDetailsActions.scaffoldDetailsLoadingFailed({ error: 'fail' }))

    expect(messageErrorSpy).toHaveBeenCalledWith({ summaryKey: 'SCAFFOLD_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED' })
  })
})

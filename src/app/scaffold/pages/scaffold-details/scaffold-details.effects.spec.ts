import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { provideMockActions } from '@ngrx/effects/testing'
import { routerNavigatedAction, RouterNavigatedPayload, SerializedRouterStateSnapshot } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { firstValueFrom, of, ReplaySubject, throwError } from 'rxjs'

import { PortalDialogService } from '@onecx/angular-accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'

import { ScaffoldService, SkillService, ToolService, Scaffold } from 'src/app/shared/generated'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'
import { scaffoldDetailsActions } from './scaffold-details.actions'
import { ScaffoldDetailsEffects } from './scaffold-details.effects'
import { initialState } from './scaffold-details.reducers'

jest.mock('@onecx/ngrx-accelerator', () => {
  const actual = jest.requireActual('@onecx/ngrx-accelerator')
  return {
    ...actual,
    filterForNavigatedTo: () => (source: unknown) => source,
    filterOutQueryParamsHaveNotChanged: () => (source: unknown) => source
  }
})

describe('ScaffoldDetailsEffects', () => {
  let actions$: ReplaySubject<Action>
  let effects: ScaffoldDetailsEffects
  let store: MockStore<Store>
  let router: Partial<jest.Mocked<Router>>
  let route: ActivatedRoute
  let messageService: Partial<jest.Mocked<PortalMessageService>>
  let portalDialogService: Partial<jest.Mocked<PortalDialogService>>
  const scaffoldService = { getScaffoldById: jest.fn(), updateScaffoldById: jest.fn(), deleteScaffoldById: jest.fn() }
  const skillService = { findSkillByCriteria: jest.fn().mockReturnValue(of({ stream: [] })) }
  const toolService = { findToolByCriteria: jest.fn().mockReturnValue(of({ stream: [] })) }

  beforeEach(async () => {
    jest.resetAllMocks()
    actions$ = new ReplaySubject(1)

    router = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
      parseUrl: jest.fn(),
      events: of()
    }

    portalDialogService = {
      openDialog: jest.fn()
    }

    messageService = {
      success: jest.fn(),
      error: jest.fn()
    }

    route = {
      queryParams: of({}),
      snapshot: { queryParams: {} }
    } as ActivatedRoute

    await TestBed.configureTestingModule({
      providers: [
        ScaffoldDetailsEffects,
        provideRouter([]),
        provideMockStore({
          initialState: { scaffoldSearch: initialState }
        }),
        provideMockActions(() => actions$),
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: ScaffoldService, useValue: scaffoldService },
        { provide: SkillService, useValue: skillService },
        { provide: ToolService, useValue: toolService },
        { provide: PortalDialogService, useValue: portalDialogService },
        { provide: PortalMessageService, useValue: messageService }
      ]
    }).compileComponents()

    store = TestBed.inject(MockStore)
    effects = TestBed.inject(ScaffoldDetailsEffects)
  })

  describe('navigatedToDetailsPage$', () => {
    it('should dispatch navigatedToDetailsPage with the route id', async () => {
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of('test-123'))

      actions$.next(
        routerNavigatedAction({
          payload: {} as RouterNavigatedPayload<SerializedRouterStateSnapshot>
        })
      )
      const action = await firstValueFrom(effects.navigatedToDetailsPage$)

      expect(action).toEqual(scaffoldDetailsActions.navigatedToDetailsPage({ id: 'test-123' }))
      expect(selectSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('loadScaffoldById$', () => {
    it('should dispatch scaffoldDetailsReceived on success with id', async () => {
      const mockId = '123'
      const mockDetails = { id: mockId }
      scaffoldService.getScaffoldById.mockReturnValue(of(mockDetails))

      actions$.next(scaffoldDetailsActions.navigatedToDetailsPage({ id: mockId }))
      const action = await firstValueFrom(effects.loadScaffoldById$)

      expect(action).toEqual(scaffoldDetailsActions.scaffoldDetailsReceived({ details: mockDetails }))
      expect(scaffoldService.getScaffoldById).toHaveBeenCalledTimes(1)
      expect(scaffoldService.getScaffoldById).toHaveBeenCalledWith(mockId)
    })

    it('should dispatch scaffoldDetailsLoadingFailedMissingId on error', async () => {
      const mockError = 'Missing ID'
      scaffoldService.getScaffoldById.mockReturnValue(throwError(() => mockError))

      actions$.next(scaffoldDetailsActions.navigatedToDetailsPage({ id: undefined }))
      const action = await firstValueFrom(effects.loadScaffoldById$)

      expect(action).toEqual(scaffoldDetailsActions.scaffoldDetailsLoadingFailedMissingId({ error: mockError }))
      expect(scaffoldService.getScaffoldById).not.toHaveBeenCalled()
    })

    it('should dispatch scaffoldDetailsLoadingFailed on error', async () => {
      const mockError = 'something went wrong'
      scaffoldService.getScaffoldById.mockReturnValue(throwError(() => mockError))

      actions$.next(scaffoldDetailsActions.navigatedToDetailsPage({ id: 'abc' }))
      const action = await firstValueFrom(effects.loadScaffoldById$)

      expect(action).toEqual(scaffoldDetailsActions.scaffoldDetailsLoadingFailed({ error: mockError }))
      expect(scaffoldService.getScaffoldById).toHaveBeenCalled()
    })
  })

  describe('cancelButtonNotDirty$', () => {
    it('should dispatch cancelEditNotDirty', async () => {
      actions$.next(scaffoldDetailsActions.cancelButtonClicked({ dirty: false }))
      const action = await firstValueFrom(effects.cancelButtonNotDirty$)

      expect(action).toEqual(scaffoldDetailsActions.cancelEditNotDirty())
    })
  })

  describe('loadSkills$', () => {
    it('should dispatch scaffoldSkillsReceived on success', async () => {
      const mockSkills = [{ id: 'skill-1' }]
      skillService.findSkillByCriteria.mockReturnValueOnce(of({ stream: mockSkills }))

      actions$.next(scaffoldDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadSkills$)

      expect(action).toEqual(scaffoldDetailsActions.scaffoldSkillsReceived({ skills: mockSkills }))
      expect(skillService.findSkillByCriteria).toHaveBeenCalledTimes(1)
      expect(skillService.findSkillByCriteria).toHaveBeenCalledWith({})
    })

    it('should dispatch scaffoldSkillsReceived with an empty list when stream is missing', async () => {
      skillService.findSkillByCriteria.mockReturnValueOnce(of({}))

      actions$.next(scaffoldDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadSkills$)

      expect(action).toEqual(scaffoldDetailsActions.scaffoldSkillsReceived({ skills: [] }))
    })

    it('should dispatch scaffoldSkillsLoadingFailed on error', async () => {
      const mockError = 'skills failed'
      skillService.findSkillByCriteria.mockReturnValueOnce(throwError(() => mockError))

      actions$.next(scaffoldDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadSkills$)

      expect(action).toEqual(scaffoldDetailsActions.scaffoldSkillsLoadingFailed({ error: mockError }))
      expect(skillService.findSkillByCriteria).toHaveBeenCalledTimes(1)
    })
  })

  describe('loadTools$', () => {
    it('should dispatch scaffoldToolsReceived on success', async () => {
      const mockTools = [{ id: 'tool-1' }]
      toolService.findToolByCriteria.mockReturnValueOnce(of({ stream: mockTools }))

      actions$.next(scaffoldDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadTools$)

      expect(action).toEqual(scaffoldDetailsActions.scaffoldToolsReceived({ tools: mockTools }))
      expect(toolService.findToolByCriteria).toHaveBeenCalledTimes(1)
      expect(toolService.findToolByCriteria).toHaveBeenCalledWith({})
    })

    it('should dispatch scaffoldToolsReceived with an empty list when stream is missing', async () => {
      toolService.findToolByCriteria.mockReturnValueOnce(of({}))

      actions$.next(scaffoldDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadTools$)

      expect(action).toEqual(scaffoldDetailsActions.scaffoldToolsReceived({ tools: [] }))
    })

    it('should dispatch scaffoldToolsLoadingFailed on error', async () => {
      const mockError = 'tools failed'
      toolService.findToolByCriteria.mockReturnValueOnce(throwError(() => mockError))

      actions$.next(scaffoldDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadTools$)

      expect(action).toEqual(scaffoldDetailsActions.scaffoldToolsLoadingFailed({ error: mockError }))
      expect(toolService.findToolByCriteria).toHaveBeenCalledTimes(1)
    })
  })

  describe('cancelButtonClickedDirty$', () => {
    it('should dispatch cancelEditConfirmClicked', async () => {
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'primary' }))

      actions$.next(scaffoldDetailsActions.cancelButtonClicked({ dirty: true }))
      const action = await firstValueFrom(effects.cancelButtonClickedDirty$)

      expect(action).toEqual(scaffoldDetailsActions.cancelEditConfirmClicked())
      expect(portalDialogService.openDialog).toHaveBeenCalledTimes(1)
      expect(portalDialogService.openDialog).toHaveBeenCalledWith(
        'SCAFFOLD_DETAILS.CANCEL.HEADER',
        'SCAFFOLD_DETAILS.CANCEL.MESSAGE',
        'SCAFFOLD_DETAILS.CANCEL.CONFIRM'
      )
    })

    it('should dispatch cancelEditBackClicked', async () => {
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'secondary' }))

      actions$.next(scaffoldDetailsActions.cancelButtonClicked({ dirty: true }))
      const action = await firstValueFrom(effects.cancelButtonClickedDirty$)

      expect(action).toEqual(scaffoldDetailsActions.cancelEditBackClicked())
      expect(portalDialogService.openDialog).toHaveBeenCalledTimes(1)
      expect(portalDialogService.openDialog).toHaveBeenCalledWith(
        'SCAFFOLD_DETAILS.CANCEL.HEADER',
        'SCAFFOLD_DETAILS.CANCEL.MESSAGE',
        'SCAFFOLD_DETAILS.CANCEL.CONFIRM'
      )
    })

    it('should dispatch cancelEditBackClicked when the dialog is dismissed', async () => {
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of(undefined))

      actions$.next(scaffoldDetailsActions.cancelButtonClicked({ dirty: true }))
      const action = await firstValueFrom(effects.cancelButtonClickedDirty$)

      expect(action).toEqual(scaffoldDetailsActions.cancelEditBackClicked())
    })
  })

  describe('saveButtonClicked$', () => {
    it('should dispatch updateScaffoldSucceeded', async () => {
      const mockDetails = { id: '123', modificationCount: 1 }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      scaffoldService.updateScaffoldById.mockReturnValueOnce(of(mockDetails))

      actions$.next(scaffoldDetailsActions.saveButtonClicked({ details: mockDetails }))
      const action = await firstValueFrom(effects.saveButtonClicked$)

      expect(action).toEqual(scaffoldDetailsActions.updateScaffoldSucceeded({ details: mockDetails }))
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(scaffoldService.updateScaffoldById).toHaveBeenCalledTimes(1)
      expect(messageService.success).toHaveBeenCalledWith({
        summaryKey: 'SCAFFOLD_DETAILS.UPDATE.SUCCESS'
      })
    })

    it('should cancel update when modificationCount is missing', async () => {
      const mockDetails = { id: '123', name: 'Scaffold' }
      jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))

      actions$.next(scaffoldDetailsActions.saveButtonClicked({ details: mockDetails }))
      const action = await firstValueFrom(effects.saveButtonClicked$)

      expect(action).toEqual(scaffoldDetailsActions.updateScaffoldCancelled())
      expect(scaffoldService.updateScaffoldById).not.toHaveBeenCalled()
    })

    it('should omit tools from the update request and return the API response as-is', async () => {
      const tools = [{ id: 'tool-1' }]
      const mockDetails = { id: '123', name: 'Scaffold', modificationCount: 2, tools } as Scaffold & {
        tools: { id: string }[]
      }
      const apiResponse = { id: '123', name: 'Scaffold', modificationCount: 3 } as Scaffold
      jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      scaffoldService.updateScaffoldById.mockReturnValueOnce(of(apiResponse))

      actions$.next(scaffoldDetailsActions.saveButtonClicked({ details: mockDetails }))
      const action = await firstValueFrom(effects.saveButtonClicked$)

      expect(scaffoldService.updateScaffoldById).toHaveBeenCalledWith('123', {
        modificationCount: 2,
        name: 'Scaffold',
        systemPrompt: undefined,
        sourceProduct: undefined,
        skills: undefined
      })
      expect(action).toEqual(
        scaffoldDetailsActions.updateScaffoldSucceeded({
          details: apiResponse
        })
      )
    })

    it('should dispatch updateScaffoldCancelled', async () => {
      const mockDetails = { id: '123' }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(undefined))
      scaffoldService.updateScaffoldById.mockReturnValueOnce(of({}))

      actions$.next(scaffoldDetailsActions.saveButtonClicked({ details: mockDetails }))
      const action = await firstValueFrom(effects.saveButtonClicked$)

      expect(action).toEqual(scaffoldDetailsActions.updateScaffoldCancelled())
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(scaffoldService.updateScaffoldById).not.toHaveBeenCalled()
      expect(messageService.success).not.toHaveBeenCalled()
    })

    it('should dispatch updateScaffoldFailed', async () => {
      const mockError = 'updateScaffold failed'
      const mockDetails = { id: '123', modificationCount: 1 }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      scaffoldService.updateScaffoldById.mockReturnValueOnce(throwError(() => mockError))

      actions$.next(scaffoldDetailsActions.saveButtonClicked({ details: mockDetails }))
      const action = await firstValueFrom(effects.saveButtonClicked$)

      expect(action).toEqual(scaffoldDetailsActions.updateScaffoldFailed({ error: mockError }))
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(scaffoldService.updateScaffoldById).toHaveBeenCalledTimes(1)
      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'SCAFFOLD_DETAILS.UPDATE.ERROR'
      })
    })
  })

  describe('deleteButtonClicked$', () => {
    it('should dispatch deleteScaffoldSucceeded when dialog confirmed and delete succeeds', async () => {
      const mockDetails = { id: '123' }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'primary' }))
      scaffoldService.deleteScaffoldById.mockReturnValueOnce(of(undefined))

      actions$.next(scaffoldDetailsActions.deleteButtonClicked())
      const action = await firstValueFrom(effects.deleteButtonClicked$)

      expect(action).toEqual(scaffoldDetailsActions.deleteScaffoldSucceeded())
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(scaffoldService.deleteScaffoldById).toHaveBeenCalledWith('123')
      expect(messageService.success).toHaveBeenCalledWith({
        summaryKey: 'SCAFFOLD_DETAILS.DELETE.SUCCESS'
      })
    })

    it('should dispatch deleteScaffoldCancelled when dialog dismissed', async () => {
      const mockDetails = { id: '123' }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'secondary' }))

      actions$.next(scaffoldDetailsActions.deleteButtonClicked())
      const action = await firstValueFrom(effects.deleteButtonClicked$)

      expect(action).toEqual(scaffoldDetailsActions.deleteScaffoldCancelled())
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(scaffoldService.deleteScaffoldById).not.toHaveBeenCalled()
    })

    it('should dispatch deleteScaffoldCancelled when dialog result is undefined', async () => {
      const mockDetails = { id: '123' }
      jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of(undefined))

      actions$.next(scaffoldDetailsActions.deleteButtonClicked())
      const action = await firstValueFrom(effects.deleteButtonClicked$)

      expect(action).toEqual(scaffoldDetailsActions.deleteScaffoldCancelled())
      expect(scaffoldService.deleteScaffoldById).not.toHaveBeenCalled()
    })

    it('should dispatch deleteScaffoldFailed when delete fails', async () => {
      const mockError = 'deleteScaffold failed'
      const mockDetails = { id: '123' }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'primary' }))
      scaffoldService.deleteScaffoldById.mockReturnValueOnce(throwError(() => mockError))

      actions$.next(scaffoldDetailsActions.deleteButtonClicked())
      const action = await firstValueFrom(effects.deleteButtonClicked$)

      expect(action).toEqual(scaffoldDetailsActions.deleteScaffoldFailed({ error: mockError }))
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(scaffoldService.deleteScaffoldById).toHaveBeenCalledWith('123')
      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'SCAFFOLD_DETAILS.DELETE.ERROR'
      })
    })

    it('should throw error when itemToDelete is undefined after dialog confirmed', async () => {
      jest.spyOn(store, 'select').mockReturnValueOnce(of(undefined))
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'primary' }))

      actions$.next(scaffoldDetailsActions.deleteButtonClicked())

      await expect(firstValueFrom(effects.deleteButtonClicked$)).rejects.toThrow('Item to delete not found!')
    })

    it('should throw error when itemToDelete has no id after dialog confirmed', async () => {
      jest.spyOn(store, 'select').mockReturnValueOnce(of({ name: 'no-id' }))
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'primary' }))

      actions$.next(scaffoldDetailsActions.deleteButtonClicked())

      await expect(firstValueFrom(effects.deleteButtonClicked$)).rejects.toThrow('Item to delete not found!')
      expect(scaffoldService.deleteScaffoldById).not.toHaveBeenCalled()
    })
  })

  describe('deleteScaffoldSucceeded$', () => {
    it('should navigate to parent URL on delete success', async () => {
      const mockUrl = '/scaffolds/details/123'
      jest.spyOn(store, 'select').mockReturnValueOnce(of(mockUrl))
      const mockUrlTree = { queryParams: {}, fragment: null, toString: () => mockUrl }
      ;(router.parseUrl as jest.Mock).mockReturnValueOnce(mockUrlTree)

      actions$.next(scaffoldDetailsActions.deleteScaffoldSucceeded())
      await firstValueFrom(effects.deleteScaffoldSucceeded$)

      expect(router.parseUrl).toHaveBeenCalledWith(mockUrl)
      expect(mockUrlTree.queryParams).toEqual({})
      expect(mockUrlTree.fragment).toBeNull()
      expect(router.navigate).toHaveBeenCalledWith(['/scaffolds'])
    })
  })

  describe('displayError$', () => {
    it('should display error message when DetailsLoadingFailed action is dispatched', async () => {
      actions$.next(
        scaffoldDetailsActions.scaffoldDetailsLoadingFailed({
          error: 'Test error'
        })
      )
      await firstValueFrom(effects.displayError$)

      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'SCAFFOLD_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
      })
    })

    it('should display error message when SkillsLoadingFailed action is dispatched', async () => {
      actions$.next(scaffoldDetailsActions.scaffoldSkillsLoadingFailed({ error: 'skills error' }))
      await firstValueFrom(effects.displayError$)

      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'SCAFFOLD_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
      })
    })

    it('should display error message when ToolsLoadingFailed action is dispatched', async () => {
      actions$.next(scaffoldDetailsActions.scaffoldToolsLoadingFailed({ error: 'tools error' }))
      await firstValueFrom(effects.displayError$)

      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'SCAFFOLD_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
      })
    })

    it('should not display error message for non-matching actions', async () => {
      actions$.next(scaffoldDetailsActions.editButtonClicked())
      await firstValueFrom(effects.displayError$)

      expect(messageService.error).not.toHaveBeenCalled()
    })
  })

  describe('navigateBack$', () => {
    it('should dispatch backNavigationStarted', async () => {
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(selectBackNavigationPossible))

      actions$.next(scaffoldDetailsActions.navigateBackButtonClicked())
      const action = await firstValueFrom(effects.navigateBack$)

      expect(action).toEqual(scaffoldDetailsActions.backNavigationStarted())
      expect(selectSpy).toHaveBeenCalledTimes(1)
    })

    it('should dispatch backNavigationFailed', async () => {
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(false))

      actions$.next(scaffoldDetailsActions.navigateBackButtonClicked())
      const action = await firstValueFrom(effects.navigateBack$)

      expect(action).toEqual(scaffoldDetailsActions.backNavigationFailed())
      expect(selectSpy).toHaveBeenCalledTimes(1)
    })
  })
})

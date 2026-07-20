import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { provideMockActions } from '@ngrx/effects/testing'
import { routerNavigatedAction, RouterNavigatedPayload, SerializedRouterStateSnapshot } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { firstValueFrom, of, ReplaySubject, throwError } from 'rxjs'

import { PortalDialogService } from '@onecx/angular-accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'

import { SkillService } from 'src/app/shared/generated'
import { skillDetailsActions } from './skill-details.actions'
import { SkillDetailsEffects } from './skill-details.effects'
import { initialState } from './skill-details.reducers'

jest.mock('@onecx/ngrx-accelerator', () => {
  const actual = jest.requireActual('@onecx/ngrx-accelerator')
  return {
    ...actual,
    filterForNavigatedTo: () => (source: unknown) => source,
    filterOutQueryParamsHaveNotChanged: () => (source: unknown) => source
  }
})

describe('SkillDetailsEffects', () => {
  let actions$: ReplaySubject<Action>
  let effects: SkillDetailsEffects
  let store: MockStore<Store>
  let router: Partial<jest.Mocked<Router>>
  let route: ActivatedRoute
  let messageService: Partial<jest.Mocked<PortalMessageService>>
  let portalDialogService: Partial<jest.Mocked<PortalDialogService>>
  const skillService = { getSkillById: jest.fn(), updateSkillById: jest.fn(), deleteSkillById: jest.fn() }

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
        SkillDetailsEffects,
        provideRouter([]),
        provideMockStore({
          initialState: { skillSearch: initialState }
        }),
        provideMockActions(() => actions$),
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: SkillService, useValue: skillService },
        { provide: PortalDialogService, useValue: portalDialogService },
        { provide: PortalMessageService, useValue: messageService }
      ]
    }).compileComponents()

    store = TestBed.inject(MockStore)
    effects = TestBed.inject(SkillDetailsEffects)
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

      expect(action).toEqual(skillDetailsActions.navigatedToDetailsPage({ id: 'test-123' }))
      expect(selectSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('loadSkillById$', () => {
    it('should dispatch skillDetailsReceived on success with id', async () => {
      const mockId = '123'
      const mockDetails = { id: mockId }
      skillService.getSkillById.mockReturnValue(of(mockDetails))

      actions$.next(skillDetailsActions.navigatedToDetailsPage({ id: mockId }))
      const action = await firstValueFrom(effects.loadSkillById$)

      expect(action).toEqual(skillDetailsActions.skillDetailsReceived({ details: mockDetails }))
      expect(skillService.getSkillById).toHaveBeenCalledTimes(1)
      expect(skillService.getSkillById).toHaveBeenCalledWith(mockId)
    })

    it('should dispatch skillDetailsLoadingFailedMissingId on error', async () => {
      const mockError = 'Missing ID'
      skillService.getSkillById.mockReturnValue(throwError(() => mockError))

      actions$.next(skillDetailsActions.navigatedToDetailsPage({ id: undefined }))
      const action = await firstValueFrom(effects.loadSkillById$)

      expect(action).toEqual(skillDetailsActions.skillDetailsLoadingFailedMissingId({ error: mockError }))
      expect(skillService.getSkillById).not.toHaveBeenCalled()
    })

    it('should dispatch skillDetailsLoadingFailed on error', async () => {
      const mockError = 'something went wrong'
      skillService.getSkillById.mockReturnValue(throwError(() => mockError))

      actions$.next(skillDetailsActions.navigatedToDetailsPage({ id: 'abc' }))
      const action = await firstValueFrom(effects.loadSkillById$)

      expect(action).toEqual(skillDetailsActions.skillDetailsLoadingFailed({ error: mockError }))
      expect(skillService.getSkillById).toHaveBeenCalled()
    })
  })

  describe('cancelButtonNotDirty$', () => {
    it('should dispatch cancelEditNotDirty', async () => {
      actions$.next(skillDetailsActions.cancelButtonClicked({ dirty: false }))
      const action = await firstValueFrom(effects.cancelButtonNotDirty$)

      expect(action).toEqual(skillDetailsActions.cancelEditNotDirty())
    })
  })

  describe('cancelButtonClickedDirty$', () => {
    it('should dispatch cancelEditConfirmClicked', async () => {
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'primary' }))

      actions$.next(skillDetailsActions.cancelButtonClicked({ dirty: true }))
      const action = await firstValueFrom(effects.cancelButtonClickedDirty$)

      expect(action).toEqual(skillDetailsActions.cancelEditConfirmClicked())
      expect(portalDialogService.openDialog).toHaveBeenCalledTimes(1)
      expect(portalDialogService.openDialog).toHaveBeenCalledWith(
        'SKILL_DETAILS.CANCEL.HEADER',
        'SKILL_DETAILS.CANCEL.MESSAGE',
        'SKILL_DETAILS.CANCEL.CONFIRM'
      )
    })

    it('should dispatch cancelEditBackClicked', async () => {
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'secondary' }))

      actions$.next(skillDetailsActions.cancelButtonClicked({ dirty: true }))
      const action = await firstValueFrom(effects.cancelButtonClickedDirty$)

      expect(action).toEqual(skillDetailsActions.cancelEditBackClicked())
      expect(portalDialogService.openDialog).toHaveBeenCalledTimes(1)
      expect(portalDialogService.openDialog).toHaveBeenCalledWith(
        'SKILL_DETAILS.CANCEL.HEADER',
        'SKILL_DETAILS.CANCEL.MESSAGE',
        'SKILL_DETAILS.CANCEL.CONFIRM'
      )
    })
  })

  describe('saveButtonClicked$', () => {
    it('should dispatch updateSkillSucceeded', async () => {
      const mockDetails = { id: '123', modificationCount: 1 }
      const mockResponse = mockDetails
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      skillService.updateSkillById.mockReturnValueOnce(of(mockResponse))

      actions$.next(skillDetailsActions.saveButtonClicked({ details: mockDetails }))
      const action = await firstValueFrom(effects.saveButtonClicked$)

      expect(action).toEqual(skillDetailsActions.updateSkillSucceeded({ details: mockDetails }))
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(skillService.updateSkillById).toHaveBeenCalledTimes(1)
      expect(messageService.success).toHaveBeenCalledWith({
        summaryKey: 'SKILL_DETAILS.UPDATE.SUCCESS'
      })
    })

    it('should cancel update when modificationCount is missing', async () => {
      const mockDetails = { id: '123', name: 'Skill' }
      jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))

      actions$.next(skillDetailsActions.saveButtonClicked({ details: { name: 'Updated' } }))
      const action = await firstValueFrom(effects.saveButtonClicked$)

      expect(action).toEqual(skillDetailsActions.updateSkillCancelled())
      expect(skillService.updateSkillById).not.toHaveBeenCalled()
    })

    it('should use the existing modificationCount when present', async () => {
      const mockDetails = { id: '123', name: 'Skill', modificationCount: 5 }
      jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      skillService.updateSkillById.mockReturnValueOnce(of(mockDetails))

      actions$.next(skillDetailsActions.saveButtonClicked({ details: { name: 'Updated' } }))
      await firstValueFrom(effects.saveButtonClicked$)

      expect(skillService.updateSkillById).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({ modificationCount: 5 })
      )
    })

    it('should dispatch updateSkillCancelled', async () => {
      const mockDetails = { id: '123' }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(undefined))
      skillService.updateSkillById.mockReturnValueOnce(of({}))

      actions$.next(skillDetailsActions.saveButtonClicked({ details: mockDetails }))
      const action = await firstValueFrom(effects.saveButtonClicked$)

      expect(action).toEqual(skillDetailsActions.updateSkillCancelled())
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(skillService.updateSkillById).not.toHaveBeenCalled()
      expect(messageService.success).not.toHaveBeenCalled()
    })

    it('should dispatch updateSkillFailed', async () => {
      const mockError = 'updateSkill failed'
      const mockDetails = { id: '123', modificationCount: 1 }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      skillService.updateSkillById.mockReturnValueOnce(throwError(() => mockError))

      actions$.next(skillDetailsActions.saveButtonClicked({ details: mockDetails }))
      const action = await firstValueFrom(effects.saveButtonClicked$)

      expect(action).toEqual(skillDetailsActions.updateSkillFailed({ error: mockError }))
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(skillService.updateSkillById).toHaveBeenCalledTimes(1)
      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'SKILL_DETAILS.UPDATE.ERROR'
      })
    })
  })

  describe('deleteButtonClicked$', () => {
    it('should dispatch deleteSkillSucceeded when dialog confirmed and delete succeeds', async () => {
      const mockDetails = { id: '123' }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'primary' }))
      skillService.deleteSkillById.mockReturnValueOnce(of(undefined))

      actions$.next(skillDetailsActions.deleteButtonClicked())
      const action = await firstValueFrom(effects.deleteButtonClicked$)

      expect(action).toEqual(skillDetailsActions.deleteSkillSucceeded())
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(skillService.deleteSkillById).toHaveBeenCalledWith('123')
      expect(messageService.success).toHaveBeenCalledWith({
        summaryKey: 'SKILL_DETAILS.DELETE.SUCCESS'
      })
    })

    it('should dispatch deleteSkillCancelled when dialog dismissed', async () => {
      const mockDetails = { id: '123' }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'secondary' }))

      actions$.next(skillDetailsActions.deleteButtonClicked())
      const action = await firstValueFrom(effects.deleteButtonClicked$)

      expect(action).toEqual(skillDetailsActions.deleteSkillCancelled())
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(skillService.deleteSkillById).not.toHaveBeenCalled()
    })

    it('should dispatch deleteSkillFailed when delete fails', async () => {
      const mockError = 'deleteSkill failed'
      const mockDetails = { id: '123' }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'primary' }))
      skillService.deleteSkillById.mockReturnValueOnce(throwError(() => mockError))

      actions$.next(skillDetailsActions.deleteButtonClicked())
      const action = await firstValueFrom(effects.deleteButtonClicked$)

      expect(action).toEqual(skillDetailsActions.deleteSkillFailed({ error: mockError }))
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(skillService.deleteSkillById).toHaveBeenCalledWith('123')
      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'SKILL_DETAILS.DELETE.ERROR'
      })
    })

    it('should throw error when itemToDelete is undefined after dialog confirmed', async () => {
      jest.spyOn(store, 'select').mockReturnValueOnce(of(undefined))
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'primary' }))

      actions$.next(skillDetailsActions.deleteButtonClicked())

      await expect(firstValueFrom(effects.deleteButtonClicked$)).rejects.toThrow('Item to delete not found!')
    })
  })

  describe('deleteSkillSucceeded$', () => {
    it('should navigate to parent URL on delete success', async () => {
      const mockUrl = '/skills/details/123'
      jest.spyOn(store, 'select').mockReturnValueOnce(of(mockUrl))
      const mockUrlTree = { queryParams: {}, fragment: null, toString: () => mockUrl }
      ;(router.parseUrl as jest.Mock).mockReturnValueOnce(mockUrlTree)

      actions$.next(skillDetailsActions.deleteSkillSucceeded())
      await firstValueFrom(effects.deleteSkillSucceeded$)

      expect(router.parseUrl).toHaveBeenCalledWith(mockUrl)
      expect(mockUrlTree.queryParams).toEqual({})
      expect(mockUrlTree.fragment).toBeNull()
      expect(router.navigate).toHaveBeenCalledWith(['/skills'])
    })

    it('should parse an empty URL when currentUrl is undefined', async () => {
      jest.spyOn(store, 'select').mockReturnValueOnce(of(undefined))
      const mockUrlTree = {
        queryParams: { a: 1 },
        fragment: 'frag',
        toString: () => '/skills/details/123'
      }
      ;(router.parseUrl as jest.Mock).mockReturnValueOnce(mockUrlTree)

      actions$.next(skillDetailsActions.deleteSkillSucceeded())
      await firstValueFrom(effects.deleteSkillSucceeded$)

      expect(router.parseUrl).toHaveBeenCalledWith('')
      expect(mockUrlTree.queryParams).toEqual({})
      expect(mockUrlTree.fragment).toBeNull()
      expect(router.navigate).toHaveBeenCalledWith(['/skills'])
    })
  })

  describe('displayError$', () => {
    it('should display error message when DetailsLoadingFailed action is dispatched', async () => {
      actions$.next(
        skillDetailsActions.skillDetailsLoadingFailed({
          error: 'Test error'
        })
      )
      await firstValueFrom(effects.displayError$)

      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'SKILL_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
      })
    })

    it('should not display error message for non-matching actions', async () => {
      actions$.next(skillDetailsActions.editButtonClicked())
      await firstValueFrom(effects.displayError$)

      expect(messageService.error).not.toHaveBeenCalled()
    })
  })

  describe('navigateBack$', () => {
    it('should dispatch backNavigationStarted', async () => {
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(true))

      actions$.next(skillDetailsActions.navigateBackButtonClicked())
      const action = await firstValueFrom(effects.navigateBack$)

      expect(action).toEqual(skillDetailsActions.backNavigationStarted())
      expect(selectSpy).toHaveBeenCalledTimes(1)
    })

    it('should dispatch backNavigationFailed', async () => {
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(false))

      actions$.next(skillDetailsActions.navigateBackButtonClicked())
      const action = await firstValueFrom(effects.navigateBack$)

      expect(action).toEqual(skillDetailsActions.backNavigationFailed())
      expect(selectSpy).toHaveBeenCalledTimes(1)
    })
  })
})

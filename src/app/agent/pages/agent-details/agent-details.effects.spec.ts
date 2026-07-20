import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { provideMockActions } from '@ngrx/effects/testing'
import { routerNavigatedAction, RouterNavigatedPayload, SerializedRouterStateSnapshot } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { firstValueFrom, of, ReplaySubject, throwError } from 'rxjs'

import { PortalDialogService } from '@onecx/angular-accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'

import {
  AgentGroupService,
  AgentService,
  ModelService,
  ProviderService,
  ScaffoldService,
  ToolService
} from 'src/app/shared/generated'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'
import { agentDetailsActions } from './agent-details.actions'
import { AgentDetailsEffects } from './agent-details.effects'
import { initialState } from './agent-details.reducers'

jest.mock('@onecx/ngrx-accelerator', () => {
  const actual = jest.requireActual('@onecx/ngrx-accelerator')
  return {
    ...actual,
    filterForNavigatedTo: () => (source: unknown) => source,
    filterOutQueryParamsHaveNotChanged: () => (source: unknown) => source
  }
})

describe('AgentDetailsEffects', () => {
  let actions$: ReplaySubject<Action>
  let effects: AgentDetailsEffects
  let store: MockStore<Store>
  let router: Partial<jest.Mocked<Router>>
  let route: ActivatedRoute
  let messageService: Partial<jest.Mocked<PortalMessageService>>
  let portalDialogService: Partial<jest.Mocked<PortalDialogService>>
  const agentService = { getAgent: jest.fn(), updateAgent: jest.fn(), deleteAgent: jest.fn() }
  const providerService = { findProviderBySearchCriteria: jest.fn() }
  const modelService = { findModelByCriteria: jest.fn() }
  const scaffoldService = { findScaffoldByCriteria: jest.fn() }
  const toolService = { findToolByCriteria: jest.fn() }
  const agentGroupService = { findAgentGroupByCriteria: jest.fn(), createAgentGroup: jest.fn() }

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
        AgentDetailsEffects,
        provideRouter([]),
        provideMockStore({
          initialState: { agentSearch: initialState }
        }),
        provideMockActions(() => actions$),
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: AgentService, useValue: agentService },
        { provide: ProviderService, useValue: providerService },
        { provide: ModelService, useValue: modelService },
        { provide: ScaffoldService, useValue: scaffoldService },
        { provide: ToolService, useValue: toolService },
        { provide: AgentGroupService, useValue: agentGroupService },
        { provide: PortalDialogService, useValue: portalDialogService },
        { provide: PortalMessageService, useValue: messageService }
      ]
    }).compileComponents()

    store = TestBed.inject(MockStore)
    effects = TestBed.inject(AgentDetailsEffects)
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

      expect(action).toEqual(agentDetailsActions.navigatedToDetailsPage({ id: 'test-123' }))
      expect(selectSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('loadAgentById$', () => {
    it('should dispatch agentDetailsReceived on success with id', async () => {
      const mockId = '123'
      const mockDetails = { id: mockId }
      agentService.getAgent.mockReturnValue(of(mockDetails))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: mockId }))
      const action = await firstValueFrom(effects.loadAgentById$)

      expect(action).toEqual(agentDetailsActions.agentDetailsReceived({ details: mockDetails }))
      expect(agentService.getAgent).toHaveBeenCalledTimes(1)
      expect(agentService.getAgent).toHaveBeenCalledWith(mockId)
    })

    it('should dispatch agentDetailsLoadingFailedMissingId on error', async () => {
      const mockError = 'Missing ID'
      agentService.getAgent.mockReturnValue(throwError(() => mockError))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: undefined }))
      const action = await firstValueFrom(effects.loadAgentById$)

      expect(action).toEqual(agentDetailsActions.agentDetailsLoadingFailedMissingId({ error: 'Missing ID' }))
      expect(agentService.getAgent).not.toHaveBeenCalled()
    })

    it('should dispatch agentDetailsLoadingFailed on error', async () => {
      const mockError = 'something went wrong'
      agentService.getAgent.mockReturnValue(throwError(() => mockError))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: 'abc' }))
      const action = await firstValueFrom(effects.loadAgentById$)

      expect(action).toEqual(agentDetailsActions.agentDetailsLoadingFailed({ error: mockError }))
      expect(agentService.getAgent).toHaveBeenCalled()
    })
  })

  describe('loadProviders$', () => {
    it('should dispatch agentProvidersReceived with the loaded providers', async () => {
      const providers = [{ id: 'p1', name: 'Provider 1' }]
      providerService.findProviderBySearchCriteria.mockReturnValue(of({ stream: providers }))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadProviders$)

      expect(action).toEqual(agentDetailsActions.agentProvidersReceived({ providers }))
    })

    it('should dispatch agentProvidersReceived with an empty list when stream is missing', async () => {
      providerService.findProviderBySearchCriteria.mockReturnValue(of({}))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadProviders$)

      expect(action).toEqual(agentDetailsActions.agentProvidersReceived({ providers: [] }))
    })

    it('should dispatch agentProvidersLoadingFailed on error', async () => {
      const mockError = 'providers failed'
      providerService.findProviderBySearchCriteria.mockReturnValue(throwError(() => mockError))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadProviders$)

      expect(action).toEqual(agentDetailsActions.agentProvidersLoadingFailed({ error: mockError }))
    })
  })

  describe('loadModels$', () => {
    it('should dispatch agentModelsReceived with the loaded models', async () => {
      const models = [{ id: 'm1', name: 'Model 1' }]
      modelService.findModelByCriteria.mockReturnValue(of({ stream: models }))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadModels$)

      expect(action).toEqual(agentDetailsActions.agentModelsReceived({ models }))
    })

    it('should dispatch agentModelsReceived with an empty list when stream is missing', async () => {
      modelService.findModelByCriteria.mockReturnValue(of({}))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadModels$)

      expect(action).toEqual(agentDetailsActions.agentModelsReceived({ models: [] }))
    })

    it('should dispatch agentModelsLoadingFailed on error', async () => {
      const mockError = 'models failed'
      modelService.findModelByCriteria.mockReturnValue(throwError(() => mockError))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadModels$)

      expect(action).toEqual(agentDetailsActions.agentModelsLoadingFailed({ error: mockError }))
    })
  })

  describe('loadScaffolds$', () => {
    it('should dispatch agentScaffoldsReceived with the loaded scaffolds', async () => {
      const scaffolds = [{ id: 's1', name: 'Scaffold 1' }]
      scaffoldService.findScaffoldByCriteria.mockReturnValue(of({ stream: scaffolds }))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadScaffolds$)

      expect(action).toEqual(agentDetailsActions.agentScaffoldsReceived({ scaffolds }))
    })

    it('should dispatch agentScaffoldsReceived with an empty list when stream is missing', async () => {
      scaffoldService.findScaffoldByCriteria.mockReturnValue(of({}))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadScaffolds$)

      expect(action).toEqual(agentDetailsActions.agentScaffoldsReceived({ scaffolds: [] }))
    })

    it('should dispatch agentScaffoldsLoadingFailed on error', async () => {
      const mockError = 'scaffolds failed'
      scaffoldService.findScaffoldByCriteria.mockReturnValue(throwError(() => mockError))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadScaffolds$)

      expect(action).toEqual(agentDetailsActions.agentScaffoldsLoadingFailed({ error: mockError }))
    })
  })

  describe('loadTools$', () => {
    it('should dispatch agentToolsReceived with the loaded tools', async () => {
      const tools = [{ id: 't1', name: 'Tool 1' }]
      toolService.findToolByCriteria.mockReturnValue(of({ stream: tools }))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadTools$)

      expect(action).toEqual(agentDetailsActions.agentToolsReceived({ tools }))
    })

    it('should dispatch agentToolsReceived with an empty list when stream is missing', async () => {
      toolService.findToolByCriteria.mockReturnValue(of({}))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadTools$)

      expect(action).toEqual(agentDetailsActions.agentToolsReceived({ tools: [] }))
    })

    it('should dispatch agentToolsLoadingFailed on error', async () => {
      const mockError = 'tools failed'
      toolService.findToolByCriteria.mockReturnValue(throwError(() => mockError))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadTools$)

      expect(action).toEqual(agentDetailsActions.agentToolsLoadingFailed({ error: mockError }))
    })
  })

  describe('loadGroups$', () => {
    it('should dispatch agentGroupsReceived with the loaded groups', async () => {
      const groups = [{ id: 'g1', name: 'Group 1' }]
      agentGroupService.findAgentGroupByCriteria.mockReturnValue(of({ stream: groups }))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadGroups$)

      expect(action).toEqual(agentDetailsActions.agentGroupsReceived({ groups }))
    })

    it('should dispatch agentGroupsReceived with an empty list when stream is missing', async () => {
      agentGroupService.findAgentGroupByCriteria.mockReturnValue(of({}))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadGroups$)

      expect(action).toEqual(agentDetailsActions.agentGroupsReceived({ groups: [] }))
    })

    it('should dispatch agentGroupsLoadingFailed on error', async () => {
      const mockError = 'groups failed'
      agentGroupService.findAgentGroupByCriteria.mockReturnValue(throwError(() => mockError))

      actions$.next(agentDetailsActions.navigatedToDetailsPage({ id: '123' }))
      const action = await firstValueFrom(effects.loadGroups$)

      expect(action).toEqual(agentDetailsActions.agentGroupsLoadingFailed({ error: mockError }))
    })
  })

  describe('createGroupInPlace$', () => {
    it('should dispatch createGroupInPlaceSucceeded and show a success message', async () => {
      const group = { id: 'g1', name: 'New Group' }
      agentGroupService.createAgentGroup.mockReturnValue(of(group))

      actions$.next(agentDetailsActions.createGroupInPlaceClicked({ name: 'New Group' }))
      const action = await firstValueFrom(effects.createGroupInPlace$)

      expect(action).toEqual(agentDetailsActions.createGroupInPlaceSucceeded({ group }))
      expect(agentGroupService.createAgentGroup).toHaveBeenCalledWith({ name: 'New Group' })
      expect(messageService.success).toHaveBeenCalledWith({
        summaryKey: 'AGENT_DETAILS.ASSIGNMENTS.CREATE_GROUP_SUCCESS'
      })
    })

    it('should dispatch createGroupInPlaceFailed and show an error message on failure', async () => {
      const mockError = 'create group failed'
      agentGroupService.createAgentGroup.mockReturnValue(throwError(() => mockError))

      actions$.next(agentDetailsActions.createGroupInPlaceClicked({ name: 'New Group' }))
      const action = await firstValueFrom(effects.createGroupInPlace$)

      expect(action).toEqual(agentDetailsActions.createGroupInPlaceFailed({ error: mockError }))
      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'AGENT_DETAILS.ASSIGNMENTS.CREATE_GROUP_FAILED'
      })
    })
  })

  describe('cancelButtonNotDirty$', () => {
    it('should dispatch cancelEditNotDirty', async () => {
      actions$.next(agentDetailsActions.cancelButtonClicked({ dirty: false }))
      const action = await firstValueFrom(effects.cancelButtonNotDirty$)

      expect(action).toEqual(agentDetailsActions.cancelEditNotDirty())
    })
  })

  describe('cancelButtonClickedDirty$', () => {
    it('should dispatch cancelEditConfirmClicked', async () => {
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'primary' }))

      actions$.next(agentDetailsActions.cancelButtonClicked({ dirty: true }))
      const action = await firstValueFrom(effects.cancelButtonClickedDirty$)

      expect(action).toEqual(agentDetailsActions.cancelEditConfirmClicked())
      expect(portalDialogService.openDialog).toHaveBeenCalledTimes(1)
      expect(portalDialogService.openDialog).toHaveBeenCalledWith(
        'AGENT_DETAILS.CANCEL.HEADER',
        'AGENT_DETAILS.CANCEL.MESSAGE',
        'AGENT_DETAILS.CANCEL.CONFIRM'
      )
    })

    it('should dispatch cancelEditBackClicked', async () => {
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'secondary' }))

      actions$.next(agentDetailsActions.cancelButtonClicked({ dirty: true }))
      const action = await firstValueFrom(effects.cancelButtonClickedDirty$)

      expect(action).toEqual(agentDetailsActions.cancelEditBackClicked())
      expect(portalDialogService.openDialog).toHaveBeenCalledTimes(1)
      expect(portalDialogService.openDialog).toHaveBeenCalledWith(
        'AGENT_DETAILS.CANCEL.HEADER',
        'AGENT_DETAILS.CANCEL.MESSAGE',
        'AGENT_DETAILS.CANCEL.CONFIRM'
      )
    })
  })

  describe('saveButtonClicked$', () => {
    it('should dispatch updateAgentSucceeded', async () => {
      const mockDetails = { id: '123' }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      agentService.updateAgent.mockReturnValueOnce(of(mockDetails))

      actions$.next(agentDetailsActions.saveButtonClicked({ details: mockDetails }))
      const action = await firstValueFrom(effects.saveButtonClicked$)

      expect(action).toEqual(agentDetailsActions.updateAgentSucceeded({ details: mockDetails }))
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(agentService.updateAgent).toHaveBeenCalledTimes(1)
      expect(messageService.success).toHaveBeenCalledWith({
        summaryKey: 'AGENT_DETAILS.UPDATE.SUCCESS'
      })
    })

    it('should use the existing modificationCount when present', async () => {
      const mockDetails = { id: '123', modificationCount: 5 }
      jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      agentService.updateAgent.mockReturnValueOnce(of(mockDetails))

      actions$.next(agentDetailsActions.saveButtonClicked({ details: mockDetails }))
      await firstValueFrom(effects.saveButtonClicked$)

      expect(agentService.updateAgent).toHaveBeenCalledWith('123', expect.objectContaining({ modificationCount: 5 }))
    })

    it('should dispatch updateAgentCancelled', async () => {
      const mockDetails = { id: '123' }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(undefined))
      agentService.updateAgent.mockReturnValueOnce(of({}))

      actions$.next(agentDetailsActions.saveButtonClicked({ details: mockDetails }))
      const action = await firstValueFrom(effects.saveButtonClicked$)

      expect(action).toEqual(agentDetailsActions.updateAgentCancelled())
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(agentService.updateAgent).not.toHaveBeenCalled()
      expect(messageService.success).not.toHaveBeenCalled()
    })

    it('should dispatch updateAgentFailed', async () => {
      const mockError = 'updateAgent failed'
      const mockDetails = { id: '123' }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      agentService.updateAgent.mockReturnValueOnce(throwError(() => mockError))

      actions$.next(agentDetailsActions.saveButtonClicked({ details: mockDetails }))
      const action = await firstValueFrom(effects.saveButtonClicked$)

      expect(action).toEqual(agentDetailsActions.updateAgentFailed({ error: mockError }))
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(agentService.updateAgent).toHaveBeenCalledTimes(1)
      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'AGENT_DETAILS.UPDATE.ERROR'
      })
    })
  })

  describe('deleteButtonClicked$', () => {
    it('should dispatch deleteAgentSucceeded when dialog confirmed and delete succeeds', async () => {
      const mockDetails = { id: '123' }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'primary' }))
      agentService.deleteAgent.mockReturnValueOnce(of(undefined))

      actions$.next(agentDetailsActions.deleteButtonClicked())
      const action = await firstValueFrom(effects.deleteButtonClicked$)

      expect(action).toEqual(agentDetailsActions.deleteAgentSucceeded())
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(agentService.deleteAgent).toHaveBeenCalledWith('123')
      expect(messageService.success).toHaveBeenCalledWith({
        summaryKey: 'AGENT_DETAILS.DELETE.SUCCESS'
      })
    })

    it('should dispatch deleteAgentCancelled when dialog dismissed', async () => {
      const mockDetails = { id: '123' }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'secondary' }))

      actions$.next(agentDetailsActions.deleteButtonClicked())
      const action = await firstValueFrom(effects.deleteButtonClicked$)

      expect(action).toEqual(agentDetailsActions.deleteAgentCancelled())
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(agentService.deleteAgent).not.toHaveBeenCalled()
    })

    it('should dispatch deleteAgentFailed when delete fails', async () => {
      const mockError = 'deleteAgent failed'
      const mockDetails = { id: '123' }
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(mockDetails))
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'primary' }))
      agentService.deleteAgent.mockReturnValueOnce(throwError(() => mockError))

      actions$.next(agentDetailsActions.deleteButtonClicked())
      const action = await firstValueFrom(effects.deleteButtonClicked$)

      expect(action).toEqual(agentDetailsActions.deleteAgentFailed({ error: mockError }))
      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(agentService.deleteAgent).toHaveBeenCalledWith('123')
      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'AGENT_DETAILS.DELETE.ERROR'
      })
    })

    it('should throw error when itemToDelete is undefined after dialog confirmed', async () => {
      jest.spyOn(store, 'select').mockReturnValueOnce(of(undefined))
      ;(portalDialogService.openDialog as jest.Mock).mockReturnValueOnce(of({ button: 'primary' }))

      actions$.next(agentDetailsActions.deleteButtonClicked())

      await expect(firstValueFrom(effects.deleteButtonClicked$)).rejects.toThrow('Item to delete not found!')
    })
  })

  describe('deleteAgentSucceeded$', () => {
    it('should navigate to parent URL on delete success', async () => {
      const mockUrl = '/agents/details/123'
      jest.spyOn(store, 'select').mockReturnValueOnce(of(mockUrl))
      const mockUrlTree = { queryParams: {}, fragment: null, toString: () => mockUrl }
      ;(router.parseUrl as jest.Mock).mockReturnValueOnce(mockUrlTree)

      actions$.next(agentDetailsActions.deleteAgentSucceeded())
      await firstValueFrom(effects.deleteAgentSucceeded$)

      expect(router.parseUrl).toHaveBeenCalledWith(mockUrl)
      expect(mockUrlTree.queryParams).toEqual({})
      expect(mockUrlTree.fragment).toBeNull()
      expect(router.navigate).toHaveBeenCalledWith(['/agents'])
    })
  })

  describe('displayError$', () => {
    it('should display error message when DetailsLoadingFailed action is dispatched', async () => {
      actions$.next(
        agentDetailsActions.agentDetailsLoadingFailed({
          error: 'Test error'
        })
      )
      await firstValueFrom(effects.displayError$)

      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'AGENT_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
      })
    })

    it('should not display error message for non-matching actions', async () => {
      actions$.next(agentDetailsActions.editButtonClicked())
      await firstValueFrom(effects.displayError$)

      expect(messageService.error).not.toHaveBeenCalled()
    })
  })

  describe('navigateBack$', () => {
    it('should dispatch backNavigationStarted', async () => {
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(selectBackNavigationPossible))

      actions$.next(agentDetailsActions.navigateBackButtonClicked())
      const action = await firstValueFrom(effects.navigateBack$)

      expect(action).toEqual(agentDetailsActions.backNavigationStarted())
      expect(selectSpy).toHaveBeenCalledTimes(1)
    })

    it('should dispatch backNavigationFailed', async () => {
      const selectSpy = jest.spyOn(store, 'select').mockReturnValueOnce(of(false))

      actions$.next(agentDetailsActions.navigateBackButtonClicked())
      const action = await firstValueFrom(effects.navigateBack$)

      expect(action).toEqual(agentDetailsActions.backNavigationFailed())
      expect(selectSpy).toHaveBeenCalledTimes(1)
    })
  })
})

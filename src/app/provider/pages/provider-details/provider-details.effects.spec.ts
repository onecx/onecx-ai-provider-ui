import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { provideMockActions } from '@ngrx/effects/testing'
import { routerNavigatedAction, RouterNavigatedPayload, SerializedRouterStateSnapshot } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { firstValueFrom, of, ReplaySubject, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { ModelService, Provider, ProviderService } from 'src/app/shared/generated'
import { ProviderDetailsActions } from './provider-details.actions'
import { ProviderDetailsEffects } from './provider-details.effects'
import { initialState } from './provider-details.reducers'
import { ProviderDetailsSelectors } from './provider-details.selectors'

jest.mock('@onecx/ngrx-accelerator', () => {
  const actual = jest.requireActual('@onecx/ngrx-accelerator')
  return {
    ...actual,
    filterForNavigatedTo: () => (source: unknown) => source,
    filterOutQueryParamsHaveNotChanged: () => (source: unknown) => source
  }
})

describe('ProviderDetailsEffects', () => {
  let actions$: ReplaySubject<Action>
  let effects: ProviderDetailsEffects
  let store: MockStore<Store>
  let router: Partial<jest.Mocked<Router>>
  let route: ActivatedRoute
  let messageService: Partial<jest.Mocked<PortalMessageService>>
  const providerService = {
    getProvider: jest.fn(),
    updateProvider: jest.fn()
  }
  const modelService = {
    findModelByCriteria: jest.fn(),
    createModel: jest.fn(),
    deleteModelById: jest.fn()
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    actions$ = new ReplaySubject(1)

    router = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
      parseUrl: jest.fn(),
      events: of()
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
        ProviderDetailsEffects,
        provideRouter([]),
        provideMockStore({
          initialState: { provider: { details: initialState } }
        }),
        provideMockActions(() => actions$),
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: ProviderService, useValue: providerService },
        { provide: ModelService, useValue: modelService },
        { provide: PortalMessageService, useValue: messageService }
      ]
    }).compileComponents()

    store = TestBed.inject(MockStore)
    effects = TestBed.inject(ProviderDetailsEffects)
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

      expect(action).toEqual(ProviderDetailsActions.navigatedToDetailsPage({ id: 'test-123' }))
      expect(selectSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('loadProviderById$', () => {
    it('should dispatch providerDetailsReceived on success with id', async () => {
      const mockId = '123'
      const mockDetails = { id: mockId } as Provider
      providerService.getProvider.mockReturnValue(of(mockDetails))

      actions$.next(ProviderDetailsActions.navigatedToDetailsPage({ id: mockId }))
      const action = await firstValueFrom(effects.loadProviderById$)

      expect(action).toEqual(ProviderDetailsActions.providerDetailsReceived({ details: mockDetails }))
      expect(providerService.getProvider).toHaveBeenCalledTimes(1)
      expect(providerService.getProvider).toHaveBeenCalledWith(mockId)
    })

    it('should dispatch providerDetailsLoadingFailed when id is missing', async () => {
      actions$.next(ProviderDetailsActions.navigatedToDetailsPage({ id: undefined }))
      const action = await firstValueFrom(effects.loadProviderById$)

      expect(action).toEqual(
        ProviderDetailsActions.providerDetailsLoadingFailed({
          error: 'Missing ID'
        })
      )
      expect(providerService.getProvider).not.toHaveBeenCalled()
    })

    it('should dispatch providerDetailsLoadingFailed on error', async () => {
      const mockError = 'something went wrong'
      providerService.getProvider.mockReturnValue(throwError(() => mockError))

      actions$.next(ProviderDetailsActions.navigatedToDetailsPage({ id: 'abc' }))
      const action = await firstValueFrom(effects.loadProviderById$)

      expect(action).toEqual(ProviderDetailsActions.providerDetailsLoadingFailed({ error: mockError }))
      expect(providerService.getProvider).toHaveBeenCalled()
    })
  })

  describe('loadProviderModelsOnNavigation$', () => {
    it('should dispatch providerModelsLoadRequested with the route id', async () => {
      actions$.next(ProviderDetailsActions.navigatedToDetailsPage({ id: 'abc' }))
      const action = await firstValueFrom(effects.loadProviderModelsOnNavigation$)

      expect(action).toEqual(ProviderDetailsActions.providerModelsLoadRequested({ providerId: 'abc' }))
    })
  })

  describe('loadProviderModels$', () => {
    it('should fail when provider id is missing', async () => {
      actions$.next(ProviderDetailsActions.providerModelsLoadRequested({ providerId: undefined }))
      const action = await firstValueFrom(effects.loadProviderModels$)

      expect(action).toEqual(
        ProviderDetailsActions.providerModelsLoadingFailed({
          error: 'Missing provider id'
        })
      )
      expect(modelService.findModelByCriteria).not.toHaveBeenCalled()
    })

    it('should dispatch providerModelsReceived with loaded models', async () => {
      const models = [{ id: 'm1', modelIdentifier: 'gpt-4' }]
      modelService.findModelByCriteria.mockReturnValue(of({ stream: models }))

      actions$.next(ProviderDetailsActions.providerModelsLoadRequested({ providerId: 'p1' }))
      const action = await firstValueFrom(effects.loadProviderModels$)

      expect(modelService.findModelByCriteria).toHaveBeenCalledWith({ providerId: 'p1' })
      expect(action).toEqual(ProviderDetailsActions.providerModelsReceived({ models }))
    })

    it('should default missing stream to an empty array', async () => {
      modelService.findModelByCriteria.mockReturnValue(of({}))

      actions$.next(ProviderDetailsActions.providerModelsLoadRequested({ providerId: 'p1' }))
      const action = await firstValueFrom(effects.loadProviderModels$)

      expect(action).toEqual(ProviderDetailsActions.providerModelsReceived({ models: [] }))
    })

    it('should dispatch providerModelsLoadingFailed on error', async () => {
      const err = 'models failed'
      modelService.findModelByCriteria.mockReturnValue(throwError(() => err))

      actions$.next(ProviderDetailsActions.providerModelsLoadRequested({ providerId: 'p1' }))
      const action = await firstValueFrom(effects.loadProviderModels$)

      expect(action).toEqual(ProviderDetailsActions.providerModelsLoadingFailed({ error: err }))
    })
  })

  describe('updateProvider$', () => {
    it('should fail when existing details id is missing', async () => {
      store.overrideSelector(ProviderDetailsSelectors.selectDetails, undefined as never)
      store.refreshState()

      actions$.next(ProviderDetailsActions.providerUpdateRequested({ details: { name: 'x' } as Provider }))
      const action = await firstValueFrom(effects.updateProvider$)

      expect(action).toEqual(
        ProviderDetailsActions.providerUpdateFailed({
          error: 'Missing provider id'
        })
      )
      expect(providerService.updateProvider).not.toHaveBeenCalled()
    })

    it('should default missing modificationCount to 0 and succeed', async () => {
      const existing = { id: '1', name: 'Old' } as Provider
      const updated = { id: '1', name: 'New' } as Provider
      store.overrideSelector(ProviderDetailsSelectors.selectDetails, existing)
      store.refreshState()
      providerService.updateProvider.mockReturnValue(of(updated))

      actions$.next(
        ProviderDetailsActions.providerUpdateRequested({
          details: {
            name: 'New',
            description: 'Desc',
            type: 'OPENAI' as never,
            llmUrl: 'http://llm',
            apiKey: 'key',
            authMode: 'API_KEY' as never
          } as Provider
        })
      )
      const action = await firstValueFrom(effects.updateProvider$)

      expect(providerService.updateProvider).toHaveBeenCalledWith('1', {
        modificationCount: 0,
        name: 'New',
        description: 'Desc',
        type: 'OPENAI',
        llmUrl: 'http://llm',
        apiKey: 'key',
        authMode: 'API_KEY'
      })
      expect(action).toEqual(ProviderDetailsActions.providerUpdateSucceeded({ details: updated }))
    })

    it('should use existing modificationCount when present', async () => {
      const existing = { id: '1', name: 'Old', modificationCount: 5 } as Provider
      store.overrideSelector(ProviderDetailsSelectors.selectDetails, existing)
      store.refreshState()
      providerService.updateProvider.mockReturnValue(of(existing))

      actions$.next(
        ProviderDetailsActions.providerUpdateRequested({
          details: { name: 'New' } as Provider
        })
      )
      await firstValueFrom(effects.updateProvider$)

      expect(providerService.updateProvider).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ modificationCount: 5 })
      )
    })

    it('should dispatch providerUpdateFailed on API error', async () => {
      const existing = { id: '1', name: 'Old', modificationCount: 1 } as Provider
      store.overrideSelector(ProviderDetailsSelectors.selectDetails, existing)
      store.refreshState()
      providerService.updateProvider.mockReturnValue(throwError(() => 'update failed'))

      actions$.next(
        ProviderDetailsActions.providerUpdateRequested({
          details: { name: 'New' } as Provider
        })
      )
      const action = await firstValueFrom(effects.updateProvider$)

      expect(action).toEqual(ProviderDetailsActions.providerUpdateFailed({ error: 'update failed' }))
    })
  })

  describe('createProviderModel$', () => {
    it('should fail when provider details id is missing', async () => {
      store.overrideSelector(ProviderDetailsSelectors.selectDetails, undefined as never)
      store.refreshState()

      actions$.next(ProviderDetailsActions.providerModelCreateClicked({ modelIdentifier: 'gpt-4' }))
      const action = await firstValueFrom(effects.createProviderModel$)

      expect(action).toEqual(
        ProviderDetailsActions.providerModelCreateFailed({
          error: 'Missing provider id'
        })
      )
      expect(modelService.createModel).not.toHaveBeenCalled()
    })

    it('should create the model and dispatch providerModelCreateSucceeded', async () => {
      const details = { id: 'p1', name: 'Provider' } as Provider
      store.overrideSelector(ProviderDetailsSelectors.selectDetails, details)
      store.refreshState()
      modelService.createModel.mockReturnValue(of({}))

      actions$.next(ProviderDetailsActions.providerModelCreateClicked({ modelIdentifier: 'gpt-4' }))
      const action = await firstValueFrom(effects.createProviderModel$)

      expect(modelService.createModel).toHaveBeenCalledWith({
        name: 'gpt-4',
        modelIdentifier: 'gpt-4',
        provider: details
      })
      expect(action).toEqual(ProviderDetailsActions.providerModelCreateSucceeded())
    })

    it('should dispatch providerModelCreateFailed on API error', async () => {
      const details = { id: 'p1', name: 'Provider' } as Provider
      store.overrideSelector(ProviderDetailsSelectors.selectDetails, details)
      store.refreshState()
      modelService.createModel.mockReturnValue(throwError(() => 'create failed'))

      actions$.next(ProviderDetailsActions.providerModelCreateClicked({ modelIdentifier: 'gpt-4' }))
      const action = await firstValueFrom(effects.createProviderModel$)

      expect(action).toEqual(ProviderDetailsActions.providerModelCreateFailed({ error: 'create failed' }))
    })
  })

  describe('deleteProviderModel$', () => {
    it('should delete the model and dispatch providerModelDeleteSucceeded', async () => {
      modelService.deleteModelById.mockReturnValue(of({}))

      actions$.next(ProviderDetailsActions.providerModelDeleteClicked({ modelId: 'm1' }))
      const action = await firstValueFrom(effects.deleteProviderModel$)

      expect(modelService.deleteModelById).toHaveBeenCalledWith('m1')
      expect(action).toEqual(ProviderDetailsActions.providerModelDeleteSucceeded())
    })

    it('should dispatch providerModelDeleteFailed on API error', async () => {
      modelService.deleteModelById.mockReturnValue(throwError(() => 'delete failed'))

      actions$.next(ProviderDetailsActions.providerModelDeleteClicked({ modelId: 'm1' }))
      const action = await firstValueFrom(effects.deleteProviderModel$)

      expect(action).toEqual(ProviderDetailsActions.providerModelDeleteFailed({ error: 'delete failed' }))
    })
  })

  describe('refreshModelsAfterMutation$', () => {
    it('should reload models after create succeeded', async () => {
      store.overrideSelector(ProviderDetailsSelectors.selectDetails, { id: 'p1' } as Provider)
      store.refreshState()

      actions$.next(ProviderDetailsActions.providerModelCreateSucceeded())
      const action = await firstValueFrom(effects.refreshModelsAfterMutation$)

      expect(action).toEqual(ProviderDetailsActions.providerModelsLoadRequested({ providerId: 'p1' }))
    })

    it('should reload models after delete succeeded', async () => {
      store.overrideSelector(ProviderDetailsSelectors.selectDetails, { id: 'p2' } as Provider)
      store.refreshState()

      actions$.next(ProviderDetailsActions.providerModelDeleteSucceeded())
      const action = await firstValueFrom(effects.refreshModelsAfterMutation$)

      expect(action).toEqual(ProviderDetailsActions.providerModelsLoadRequested({ providerId: 'p2' }))
    })

    it('should reload models with undefined providerId when details are missing', async () => {
      store.overrideSelector(ProviderDetailsSelectors.selectDetails, undefined as never)
      store.refreshState()

      actions$.next(ProviderDetailsActions.providerModelCreateSucceeded())
      const action = await firstValueFrom(effects.refreshModelsAfterMutation$)

      expect(action).toEqual(ProviderDetailsActions.providerModelsLoadRequested({ providerId: undefined }))
    })
  })

  describe('displaySuccess$', () => {
    it('should display success message on providerUpdateSucceeded', async () => {
      actions$.next(ProviderDetailsActions.providerUpdateSucceeded({ details: { id: '1' } as Provider }))
      await firstValueFrom(effects.displaySuccess$)

      expect(messageService.success).toHaveBeenCalledWith({
        summaryKey: 'PROVIDER_DETAILS.SUCCESS_MESSAGES.UPDATE_SUCCEEDED'
      })
    })

    it('should display success message on providerModelCreateSucceeded', async () => {
      actions$.next(ProviderDetailsActions.providerModelCreateSucceeded())
      await firstValueFrom(effects.displaySuccess$)

      expect(messageService.success).toHaveBeenCalledWith({
        summaryKey: 'PROVIDER_DETAILS.SUCCESS_MESSAGES.MODEL_CREATE_SUCCEEDED'
      })
    })

    it('should display success message on providerModelDeleteSucceeded', async () => {
      actions$.next(ProviderDetailsActions.providerModelDeleteSucceeded())
      await firstValueFrom(effects.displaySuccess$)

      expect(messageService.success).toHaveBeenCalledWith({
        summaryKey: 'PROVIDER_DETAILS.SUCCESS_MESSAGES.MODEL_DELETE_SUCCEEDED'
      })
    })
  })

  describe('displayError$', () => {
    it('should display error message on providerDetailsLoadingFailed', async () => {
      actions$.next(ProviderDetailsActions.providerDetailsLoadingFailed({ error: 'err' }))
      await firstValueFrom(effects.displayError$)

      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'PROVIDER_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
      })
    })

    it('should display error message on providerUpdateFailed', async () => {
      actions$.next(ProviderDetailsActions.providerUpdateFailed({ error: 'err' }))
      await firstValueFrom(effects.displayError$)

      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'PROVIDER_DETAILS.ERROR_MESSAGES.UPDATE_FAILED'
      })
    })

    it('should display error message on providerModelsLoadingFailed', async () => {
      actions$.next(ProviderDetailsActions.providerModelsLoadingFailed({ error: 'err' }))
      await firstValueFrom(effects.displayError$)

      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'PROVIDER_DETAILS.ERROR_MESSAGES.MODELS_LOADING_FAILED'
      })
    })

    it('should display error message on providerModelCreateFailed', async () => {
      actions$.next(ProviderDetailsActions.providerModelCreateFailed({ error: 'err' }))
      await firstValueFrom(effects.displayError$)

      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'PROVIDER_DETAILS.ERROR_MESSAGES.MODEL_CREATE_FAILED'
      })
    })

    it('should display error message on providerModelDeleteFailed', async () => {
      actions$.next(ProviderDetailsActions.providerModelDeleteFailed({ error: 'err' }))
      await firstValueFrom(effects.displayError$)

      expect(messageService.error).toHaveBeenCalledWith({
        summaryKey: 'PROVIDER_DETAILS.ERROR_MESSAGES.MODEL_DELETE_FAILED'
      })
    })

    it('should not display on unrelated action', async () => {
      actions$.next(ProviderDetailsActions.apiKeyVisibilityToggled())
      await firstValueFrom(effects.displayError$)

      expect(messageService.error).not.toHaveBeenCalled()
    })
  })
})

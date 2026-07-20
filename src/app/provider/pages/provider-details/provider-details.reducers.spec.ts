import { ProviderDetailsActions } from './provider-details.actions'
import { ProviderDetailsReducer, initialState } from './provider-details.reducers'
import { ProviderDetailsState } from './provider-details.state'

describe('ProviderDetailsReducer', () => {
  it('should set details on providerDetailsReceived', () => {
    const details = { id: '1', name: 'Test' } as any
    const action = ProviderDetailsActions.providerDetailsReceived({ details })
    const state = ProviderDetailsReducer(initialState, action)
    expect(state.details).toEqual(details)
  })

  it('should set details to undefined on providerDetailsLoadingFailed', () => {
    const prevState: ProviderDetailsState = { ...initialState, details: { id: '1' } as any }
    const action = ProviderDetailsActions.providerDetailsLoadingFailed({ error: null })
    const state = ProviderDetailsReducer(prevState, action)
    expect(state.details).toBeUndefined()
  })

  it('should reset state on navigatedToDetailsPage', () => {
    const prevState: ProviderDetailsState = {
      ...initialState,
      details: { id: '1' } as any,
      editMode: true,
      isApiKeyHidden: false
    }
    const action = ProviderDetailsActions.navigatedToDetailsPage({ id: undefined })
    const state = ProviderDetailsReducer(prevState, action)
    expect(state).toEqual(initialState)
  })

  it('should set editMode on providerDetailsEditModeSet', () => {
    const action = ProviderDetailsActions.providerDetailsEditModeSet({ editMode: true })
    const state = ProviderDetailsReducer(initialState, action)
    expect(state.editMode).toBe(true)
  })

  it('should toggle isApiKeyHidden on apiKeyVisibilityToggled', () => {
    const prevState: ProviderDetailsState = { ...initialState, isApiKeyHidden: true }
    const action = ProviderDetailsActions.apiKeyVisibilityToggled()
    const state = ProviderDetailsReducer(prevState, action)
    expect(state.isApiKeyHidden).toBe(false)
  })

  it('should set models on providerModelsReceived', () => {
    const models = [{ id: 'm1', modelIdentifier: 'Opus-3.5' }] as any
    const action = ProviderDetailsActions.providerModelsReceived({ models })
    const state = ProviderDetailsReducer(initialState, action)
    expect(state.models).toEqual(models)
    expect(state.modelsLoaded).toBe(true)
  })

  it('should set isSubmitting on providerUpdateRequested', () => {
    const action = ProviderDetailsActions.providerUpdateRequested({ details: { name: 'Test' } as any })
    const state = ProviderDetailsReducer(initialState, action)
    expect(state.isSubmitting).toBe(true)
  })

  it('should set details and clear editMode/isSubmitting on providerUpdateSucceeded', () => {
    const details = { id: '1', name: 'Updated' } as any
    const prevState: ProviderDetailsState = { ...initialState, editMode: true, isSubmitting: true }
    const action = ProviderDetailsActions.providerUpdateSucceeded({ details })
    const state = ProviderDetailsReducer(prevState, action)
    expect(state.details).toEqual(details)
    expect(state.editMode).toBe(false)
    expect(state.isSubmitting).toBe(false)
  })

  it('should clear isSubmitting on providerUpdateFailed', () => {
    const prevState: ProviderDetailsState = { ...initialState, isSubmitting: true }
    const action = ProviderDetailsActions.providerUpdateFailed({ error: 'err' })
    const state = ProviderDetailsReducer(prevState, action)
    expect(state.isSubmitting).toBe(false)
  })

  it('should set modelsLoadingIndicator on providerModelsLoadRequested', () => {
    const prevState: ProviderDetailsState = { ...initialState, modelsLoadingIndicator: false }
    const action = ProviderDetailsActions.providerModelsLoadRequested({ providerId: '1' })
    const state = ProviderDetailsReducer(prevState, action)
    expect(state.modelsLoadingIndicator).toBe(true)
  })

  it('should clear models on providerModelsLoadingFailed', () => {
    const prevState: ProviderDetailsState = {
      ...initialState,
      models: [{ id: 'm1' } as any],
      modelsLoadingIndicator: true,
      modelsLoaded: true
    }
    const action = ProviderDetailsActions.providerModelsLoadingFailed({ error: 'err' })
    const state = ProviderDetailsReducer(prevState, action)
    expect(state.models).toEqual([])
    expect(state.modelsLoadingIndicator).toBe(false)
    expect(state.modelsLoaded).toBe(false)
  })

  it('should set modelMutationInProgress on providerModelCreateClicked', () => {
    const action = ProviderDetailsActions.providerModelCreateClicked({ modelIdentifier: 'gpt-4' })
    const state = ProviderDetailsReducer(initialState, action)
    expect(state.modelMutationInProgress).toBe(true)
  })

  it('should set modelMutationInProgress on providerModelDeleteClicked', () => {
    const action = ProviderDetailsActions.providerModelDeleteClicked({ modelId: 'm1' })
    const state = ProviderDetailsReducer(initialState, action)
    expect(state.modelMutationInProgress).toBe(true)
  })

  it('should clear modelMutationInProgress on providerModelCreateSucceeded', () => {
    const prevState: ProviderDetailsState = { ...initialState, modelMutationInProgress: true }
    const action = ProviderDetailsActions.providerModelCreateSucceeded()
    const state = ProviderDetailsReducer(prevState, action)
    expect(state.modelMutationInProgress).toBe(false)
  })

  it('should clear modelMutationInProgress on providerModelDeleteFailed', () => {
    const prevState: ProviderDetailsState = { ...initialState, modelMutationInProgress: true }
    const action = ProviderDetailsActions.providerModelDeleteFailed({ error: 'err' })
    const state = ProviderDetailsReducer(prevState, action)
    expect(state.modelMutationInProgress).toBe(false)
  })
})

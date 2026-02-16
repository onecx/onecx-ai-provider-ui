import { ProviderDetailsActions } from "./provider-details.actions"
import { ProviderDetailsReducer, initialState } from "./provider-details.reducers"
import { ProviderDetailsState } from "./provider-details.state"

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
    const prevState: ProviderDetailsState = { details: { id: '1' } as any, editMode: true, isApiKeyHidden: false }
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
})
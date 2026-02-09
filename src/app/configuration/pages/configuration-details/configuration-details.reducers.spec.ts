import { configurationDetailsReducer, initialState } from "./configuration-details.reducers"
import { ConfigurationDetailsActions } from "./configuration-details.actions"

describe('configurationDetailsReducer', () => {
  it('should return the initial state', () => {
    const action = { type: 'Unknown' } as any
    const state = configurationDetailsReducer(undefined, action)
    expect(state).toEqual(initialState)
  })

  it('should handle configurationDetailsReceived', () => {
    const details = { id: '1', name: 'test' }
    const action = ConfigurationDetailsActions.configurationDetailsReceived({ details })
    const state = configurationDetailsReducer(initialState, action)
    expect(state.details).toEqual(details)
    expect(state.detailsLoadingIndicator).toBe(false)
    expect(state.detailsLoaded).toBe(true)
  })

  it('should handle configurationDetailsLoadingFailed', () => {
    const action = ConfigurationDetailsActions.configurationDetailsLoadingFailed({ error: 'err' })
    const state = configurationDetailsReducer({ ...initialState, details: { id: '1', name: 'test' } }, action)
    expect(state.details).toBeUndefined()
    expect(state.detailsLoadingIndicator).toBe(false)
    expect(state.detailsLoaded).toBe(false)
  })

  it('should handle configurationProvidersReceived', () => {
    const providers = [{ id: 'p1', name: 'Provider 1', modelName: 'model' }, { id: 'p2', name: 'Provider 2', modelName: 'model' }]
    const action = ConfigurationDetailsActions.configurationProvidersReceived({ providers })
    const state = configurationDetailsReducer(initialState, action)
    expect(state.Providers).toEqual(providers)
    expect(state.ProvidersLoadingIndicator).toBe(false)
    expect(state.ProvidersLoaded).toBe(true)
  })

  it('should handle configurationProvidersLoadingFailed', () => {
    const action = ConfigurationDetailsActions.configurationProvidersLoadingFailed({ error: 'err' })
    const state = configurationDetailsReducer({ ...initialState, Providers: [{ id: 'p', name: 'Provider', modelName: 'model' }] }, action)
    expect(state.Providers).toEqual([])
    expect(state.ProvidersLoadingIndicator).toBe(false)
    expect(state.ProvidersLoaded).toBe(false)
  })

  it('should handle configurationMCPServersReceived', () => {
    const MCPServers = [{ id: 'm1' }]
    const action = ConfigurationDetailsActions.configurationMCPServersReceived({ MCPServers })
    const state = configurationDetailsReducer(initialState, action)
    expect(state.mcpServers).toEqual(MCPServers)
    expect(state.mcpServersLoadingIndicator).toBe(false)
    expect(state.mcpServersLoaded).toBe(true)
  })

  it('should handle configurationMCPServersLoadingFailed', () => {
    const action = ConfigurationDetailsActions.configurationMCPServersLoadingFailed({ error: 'err' })
    const state = configurationDetailsReducer({ ...initialState, mcpServers: [{ id: 'm' }] }, action)
    expect(state.mcpServers).toEqual([])
    expect(state.mcpServersLoadingIndicator).toBe(false)
    expect(state.mcpServersLoaded).toBe(false)
  })

  it('should reset state on navigatedToDetailsPage', () => {
    const action = ConfigurationDetailsActions.navigatedToDetailsPage({ id: '1' })
    const state = configurationDetailsReducer({ ...initialState, details: { id: 'x', name: 'test' } }, action)
    expect(state).toEqual(initialState)
  })

  it('should set editMode true on editButtonClicked', () => {
    const action = ConfigurationDetailsActions.editButtonClicked()
    const state = configurationDetailsReducer(initialState, action)
    expect(state.editMode).toBe(true)
  })

  it('should update details, set editMode false, isSubmitting true on saveButtonClicked', () => {
    const details = { id: '1', name: 'changed' }
    const action = ConfigurationDetailsActions.saveButtonClicked({ details })
    const state = configurationDetailsReducer(initialState, action)
    expect(state.details).toEqual(details)
    expect(state.editMode).toBe(false)
    expect(state.isSubmitting).toBe(true)
  })

  it('should not change state on navigateBackButtonClicked', () => {
    const action = ConfigurationDetailsActions.navigateBackButtonClicked()
    const state = configurationDetailsReducer(initialState, action)
    expect(state).toEqual(initialState)
  })

  it('should set editMode false, isSubmitting false on cancelEditConfirmClicked, cancelEditNotDirty, updateConfigurationCancelled, updateConfigurationSucceeded', () => {
    const prevState = { ...initialState, editMode: true, isSubmitting: true }
    const actions = [
      ConfigurationDetailsActions.cancelEditConfirmClicked(),
      ConfigurationDetailsActions.cancelEditNotDirty(),
      ConfigurationDetailsActions.updateConfigurationCancelled(),
      ConfigurationDetailsActions.updateConfigurationSucceeded()
    ]
    for (const action of actions) {
      const state = configurationDetailsReducer(prevState, action)
      expect(state.editMode).toBe(false)
      expect(state.isSubmitting).toBe(false)
    }
  })

  it('should set isSubmitting false on updateConfigurationFailed', () => {
    const prevState = { ...initialState, isSubmitting: true }
    const action = ConfigurationDetailsActions.updateConfigurationFailed({ error: 'err' })
    const state = configurationDetailsReducer(prevState, action)
    expect(state.isSubmitting).toBe(false)
  })
})
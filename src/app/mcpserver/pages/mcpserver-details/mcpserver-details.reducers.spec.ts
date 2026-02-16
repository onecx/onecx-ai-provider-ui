import { MCPServerDetailsActions } from "./mcpserver-details.actions"
import { mcpserverDetailsReducer, initialState } from "./mcpserver-details.reducers"
import { MCPServerDetailsState } from "./mcpserver-details.state"

describe('MCPServerDetailsReducer', () => {
  it('should set details on mcpserverDetailsReceived', () => {
    const details = { id: '1', name: 'Test' } as any
    const action = MCPServerDetailsActions.mCPServerDetailsReceived({ details })
    const state = mcpserverDetailsReducer(initialState, action)
    expect(state.details).toEqual(details)
  })

  it('should set details to undefined on mcpserverDetailsLoadingFailed', () => {
    const prevState: MCPServerDetailsState = { ...initialState, details: { id: '1' } as any }
    const action = MCPServerDetailsActions.mCPServerDetailsLoadingFailed({ error: null })
    const state = mcpserverDetailsReducer(prevState, action)
    expect(state.details).toBeUndefined()
  })

  it('should reset state on navigatedToDetailsPage', () => {
    const prevState: MCPServerDetailsState = { details: { id: '1' } as any, editMode: true, isApiKeyHidden: false, detailsLoaded: false, detailsLoadingIndicator: false, isSubmitting: false }
    const action = MCPServerDetailsActions.navigatedToDetailsPage({ id: undefined })
    const state = mcpserverDetailsReducer(prevState, action)
    expect(state).toEqual(initialState)
  })


  it('should set editMode on editButtonClicked', () => {
    const action = MCPServerDetailsActions.editButtonClicked()
    const state = mcpserverDetailsReducer(initialState, action)
    expect(state.editMode).toBe(true)
  })

  it('should set isSubmitting to true on saveButtonClicked', () => {
    const action = MCPServerDetailsActions.saveButtonClicked({ details: {} as any })
    const state = mcpserverDetailsReducer(initialState, action)
    expect(state.isSubmitting).toBe(true)
  })

  it('should set editMode to false on cancelEditConfirmClicked', () => {
    const prevState: MCPServerDetailsState = { ...initialState, editMode: true }
    const action = MCPServerDetailsActions.cancelEditConfirmClicked()
    const state = mcpserverDetailsReducer(prevState, action)
    expect(state.editMode).toBe(false)
  })

  it('should set editMode to false on cancelButtonClicked with dirty false', () => {
    const prevState: MCPServerDetailsState = { ...initialState, editMode: true }
    const action = MCPServerDetailsActions.cancelButtonClicked({ dirty: false })
    const state = mcpserverDetailsReducer(prevState, action)
    expect(state.editMode).toBe(false)
  })

  it('should keep editMode on cancelButtonClicked with dirty true', () => {
    const prevState: MCPServerDetailsState = { ...initialState, editMode: true }
    const action = MCPServerDetailsActions.cancelButtonClicked({ dirty: true })
    const state = mcpserverDetailsReducer(prevState, action)
    expect(state.editMode).toBe(true)
  })


  it('should set editMode to false on updateMCPServerCancelled', () => {
    const prevState: MCPServerDetailsState = { ...initialState, editMode: true }
    const action = MCPServerDetailsActions.updateMCPServerCancelled()
    const state = mcpserverDetailsReducer(prevState, action)
    expect(state.editMode).toBe(false)
  })

  it('should set editMode to false on updateMCPServerSucceeded', () => {
    const prevState: MCPServerDetailsState = { ...initialState, editMode: true, isSubmitting: true }
    const action = MCPServerDetailsActions.updateMCPServerSucceeded()
    const state = mcpserverDetailsReducer(prevState, action)
    expect(state.editMode).toBe(false)
  })

  it('should set isSubmitting to false on updateMCPServerFailed', () => {
    const prevState: MCPServerDetailsState = { ...initialState, isSubmitting: true }
    const action = MCPServerDetailsActions.updateMCPServerFailed({ error: 'Test error' })
    const state = mcpserverDetailsReducer(prevState, action)
    expect(state.isSubmitting).toBe(false)
  })

  
  it('should toggle isApiKeyHidden from true to false', () => {
    const prevState: MCPServerDetailsState = { ...initialState, isApiKeyHidden: true }
    const action = MCPServerDetailsActions.apiKeyVisibilityToggled()
    const state = mcpserverDetailsReducer(prevState, action)
    expect(state.isApiKeyHidden).toBe(false)
  })

  it('should toggle isApiKeyHidden from false to true', () => {
    const prevState: MCPServerDetailsState = { ...initialState, isApiKeyHidden: false }
    const action = MCPServerDetailsActions.apiKeyVisibilityToggled()
    const state = mcpserverDetailsReducer(prevState, action)
    expect(state.isApiKeyHidden).toBe(true)
  })

  it('should set detailsLoadingIndicator to false and detailsLoaded to true on mCPServerDetailsReceived', () => {
    const details = { id: '1', name: 'Test' } as any
    const action = MCPServerDetailsActions.mCPServerDetailsReceived({ details })
    const state = mcpserverDetailsReducer(initialState, action)
    expect(state.detailsLoadingIndicator).toBe(false)
    expect(state.detailsLoaded).toBe(true)
  })

  it('should set detailsLoadingIndicator to false and detailsLoaded to false on mCPServerDetailsLoadingFailed', () => {
    const action = MCPServerDetailsActions.mCPServerDetailsLoadingFailed({ error: null })
    const state = mcpserverDetailsReducer(initialState, action)
    expect(state.detailsLoadingIndicator).toBe(false)
    expect(state.detailsLoaded).toBe(false)
  })
})
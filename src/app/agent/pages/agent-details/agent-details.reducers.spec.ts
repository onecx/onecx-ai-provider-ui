import { agentDetailsActions } from './agent-details.actions'
import { agentDetailsReducer, initialState } from './agent-details.reducers'

describe('agentDetailsReducer', () => {
  it('should set details on agentDetailsReceived', () => {
    const details = { id: '1' }
    const action = agentDetailsActions.agentDetailsReceived({
      details
    })
    const nextState = agentDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState,
      details,
      detailsLoaded: true,
      detailsLoadingIndicator: false
    })
  })

  it('should handle agentDetailsLoadingFailed action', () => {
    const action = agentDetailsActions.agentDetailsLoadingFailed({
      error: null
    })
    const nextState = agentDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState,
      details: undefined,
      detailsLoaded: false,
      detailsLoadingIndicator: false
    })
  })

  it('should handle navigatedToDetailsPage action', () => {
    const action = agentDetailsActions.navigatedToDetailsPage({ id: '1' })
    const nextState = agentDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState
    })
  })

  it('should set editMode true on editButtonClicked', () => {
    const action = agentDetailsActions.editButtonClicked()
    const nextState = agentDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState,
      editMode: true
    })
  })

  it('should set isSubmitting true on saveButtonClicked', () => {
    const details = { id: '1' }
    const action = agentDetailsActions.saveButtonClicked({ details })
    const nextState = agentDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState,
      isSubmitting: true
    })
  })

  it('should set editMode false on cancelEditConfirmClicked', () => {
    const newState = { ...initialState, editMode: true }
    const action = agentDetailsActions.cancelEditConfirmClicked()
    const nextState = agentDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      editMode: false
    })
  })

  it('should set editMode false on cancelEditNotDirty', () => {
    const newState = { ...initialState, editMode: true }
    const action = agentDetailsActions.cancelEditNotDirty()
    const nextState = agentDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      editMode: false
    })
  })

  it('should set editMode false on updateAgentCancelled', () => {
    const newState = { ...initialState, editMode: true }
    const action = agentDetailsActions.updateAgentCancelled()
    const nextState = agentDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      editMode: false
    })
  })

  it('should update details and set editMode false on updateAgentSucceeded', () => {
    const details = { id: '1' }
    const newState = { ...initialState, editMode: true, isSubmitting: true }
    const action = agentDetailsActions.updateAgentSucceeded({ details })
    const nextState = agentDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      details,
      editMode: false,
      isSubmitting: false
    })
  })

  it('should handle updateAgentFailed action', () => {
    const newState = { ...initialState, isSubmitting: true }
    const action = agentDetailsActions.updateAgentFailed({
      error: null
    })
    const nextState = agentDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      isSubmitting: false
    })
  })
})

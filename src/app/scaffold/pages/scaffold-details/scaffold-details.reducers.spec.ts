import { scaffoldDetailsActions } from './scaffold-details.actions'
import { initialState, scaffoldDetailsReducer } from './scaffold-details.reducers'

describe('scaffoldDetailsReducer', () => {
  it('should set details on scaffoldDetailsReceived', () => {
    const details = { id: '1' }
    const action = scaffoldDetailsActions.scaffoldDetailsReceived({
      details
    })
    const nextState = scaffoldDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState,
      details,
      detailsLoaded: true,
      detailsLoadingIndicator: false
    })
  })

  it('should handle scaffoldDetailsLoadingFailed action', () => {
    const action = scaffoldDetailsActions.scaffoldDetailsLoadingFailed({
      error: null
    })
    const nextState = scaffoldDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState,
      details: undefined,
      detailsLoaded: false,
      detailsLoadingIndicator: false
    })
  })

  it('should handle navigatedToDetailsPage action', () => {
    const action = scaffoldDetailsActions.navigatedToDetailsPage({ id: '1' })
    const nextState = scaffoldDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState
    })
  })

  it('should set editMode true on editButtonClicked', () => {
    const action = scaffoldDetailsActions.editButtonClicked()
    const nextState = scaffoldDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState,
      editMode: true
    })
  })

  it('should set isSubmitting true on saveButtonClicked', () => {
    const details = { id: '1' }
    const action = scaffoldDetailsActions.saveButtonClicked({ details })
    const nextState = scaffoldDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState,
      isSubmitting: true
    })
  })

  it('should set editMode false on cancelEditConfirmClicked', () => {
    const newState = { ...initialState, editMode: true }
    const action = scaffoldDetailsActions.cancelEditConfirmClicked()
    const nextState = scaffoldDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      editMode: false
    })
  })

  it('should set editMode false on cancelEditNotDirty', () => {
    const newState = { ...initialState, editMode: true }
    const action = scaffoldDetailsActions.cancelEditNotDirty()
    const nextState = scaffoldDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      editMode: false
    })
  })

  it('should set editMode false on updateScaffoldCancelled', () => {
    const newState = { ...initialState, editMode: true }
    const action = scaffoldDetailsActions.updateScaffoldCancelled()
    const nextState = scaffoldDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      editMode: false
    })
  })

  it('should update details and set editMode false on updateScaffoldSucceeded', () => {
    const details = { id: '1' }
    const newState = { ...initialState, editMode: true, isSubmitting: true }
    const action = scaffoldDetailsActions.updateScaffoldSucceeded({ details })
    const nextState = scaffoldDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      details,
      editMode: false,
      isSubmitting: false
    })
  })

  it('should handle updateScaffoldFailed action', () => {
    const newState = { ...initialState, isSubmitting: true }
    const action = scaffoldDetailsActions.updateScaffoldFailed({
      error: null
    })
    const nextState = scaffoldDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      isSubmitting: false
    })
  })
})

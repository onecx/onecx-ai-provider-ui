import { skillDetailsActions } from './skill-details.actions'
import { initialState, skillDetailsReducer } from './skill-details.reducers'

describe('skillDetailsReducer', () => {
  it('should set details on skillDetailsReceived', () => {
    const details = { id: '1' }
    const action = skillDetailsActions.skillDetailsReceived({
      details
    })
    const nextState = skillDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState,
      details,
      detailsLoaded: true,
      detailsLoadingIndicator: false
    })
  })

  it('should handle skillDetailsLoadingFailed action', () => {
    const action = skillDetailsActions.skillDetailsLoadingFailed({
      error: null
    })
    const nextState = skillDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState,
      details: undefined,
      detailsLoaded: false,
      detailsLoadingIndicator: false
    })
  })

  it('should handle navigatedToDetailsPage action', () => {
    const action = skillDetailsActions.navigatedToDetailsPage({ id: '1' })
    const nextState = skillDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState
    })
  })

  it('should set editMode true on editButtonClicked', () => {
    const action = skillDetailsActions.editButtonClicked()
    const nextState = skillDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState,
      editMode: true
    })
  })

  it('should set isSubmitting true on saveButtonClicked', () => {
    const details = { id: '1' }
    const action = skillDetailsActions.saveButtonClicked({ details })
    const nextState = skillDetailsReducer(initialState, action)

    expect(nextState).toEqual({
      ...initialState,
      isSubmitting: true
    })
  })

  it('should set editMode false on cancelEditConfirmClicked', () => {
    const newState = { ...initialState, editMode: true }
    const action = skillDetailsActions.cancelEditConfirmClicked()
    const nextState = skillDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      editMode: false
    })
  })

  it('should set editMode false on cancelEditNotDirty', () => {
    const newState = { ...initialState, editMode: true }
    const action = skillDetailsActions.cancelEditNotDirty()
    const nextState = skillDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      editMode: false
    })
  })

  it('should set editMode false on updateSkillCancelled', () => {
    const newState = { ...initialState, editMode: true }
    const action = skillDetailsActions.updateSkillCancelled()
    const nextState = skillDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      editMode: false
    })
  })

  it('should update details and set editMode false on updateSkillSucceeded', () => {
    const details = { id: '1' }
    const newState = { ...initialState, editMode: true, isSubmitting: true }
    const action = skillDetailsActions.updateSkillSucceeded({ details })
    const nextState = skillDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      details,
      editMode: false,
      isSubmitting: false
    })
  })

  it('should handle updateSkillFailed action', () => {
    const newState = { ...initialState, isSubmitting: true }
    const action = skillDetailsActions.updateSkillFailed({
      error: null
    })
    const nextState = skillDetailsReducer(newState, action)

    expect(nextState).toEqual({
      ...initialState,
      isSubmitting: false
    })
  })
})

import { ScaffoldDetailsActions } from './scaffold-details.actions'
import { scaffoldDetailsReducer, initialState } from './scaffold-details.reducers'

describe('scaffoldDetailsReducer', () => {
  it('should reset state on navigatedToDetailsPage', () => {
    const prevState = { details: { id: '1', name: 'Test' } as any, editMode: true }
    const state = scaffoldDetailsReducer(prevState as any, ScaffoldDetailsActions.navigatedToDetailsPage({ id: '1' }))

    expect(state).toEqual(initialState)
  })

  it('should set details on scaffoldDetailsReceived', () => {
    const details = { id: '1', name: 'Test' } as any
    const state = scaffoldDetailsReducer(initialState, ScaffoldDetailsActions.scaffoldDetailsReceived({ details }))

    expect(state.details).toEqual(details)
  })

  it('should clear details on scaffoldDetailsLoadingFailed', () => {
    const state = scaffoldDetailsReducer({ details: { id: '1' } as any, editMode: false }, ScaffoldDetailsActions.scaffoldDetailsLoadingFailed({ error: 'error' }))

    expect(state.details).toBeUndefined()
  })

  it('should set editMode on scaffoldDetailsEditModeSet', () => {
    const state = scaffoldDetailsReducer(initialState, ScaffoldDetailsActions.scaffoldDetailsEditModeSet({ editMode: true }))

    expect(state.editMode).toBe(true)
  })
})

import { createReducer, on } from '@ngrx/store'
import { ScaffoldDetailsActions } from './scaffold-details.actions'
import { ScaffoldDetailsState } from './scaffold-details.state'

export const initialState: ScaffoldDetailsState = {
  details: undefined,
  editMode: false,
}

export const scaffoldDetailsReducer = createReducer(
  initialState,
  on(ScaffoldDetailsActions.navigatedToDetailsPage, (): ScaffoldDetailsState => ({ ...initialState })),
  on(ScaffoldDetailsActions.scaffoldDetailsReceived, (state, { details }): ScaffoldDetailsState => ({
    ...state,
    details
  })),
  on(ScaffoldDetailsActions.scaffoldDetailsLoadingFailed, (state): ScaffoldDetailsState => ({
    ...state,
    details: undefined
  })),
  on(ScaffoldDetailsActions.scaffoldDetailsEditModeSet, (state, { editMode }): ScaffoldDetailsState => ({
    ...state,
    editMode
  }))
)
